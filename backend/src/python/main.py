from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import os
import json
from pathlib import Path

from LlamaNodeConnector import LlamaNodeConnector

app = FastAPI(title="SuperPod API", description="AI-powered podcast discovery platform")

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for audio serving
audio_dir = Path(__file__).parent / "audio_files"
if audio_dir.exists():
    app.mount("/audio", StaticFiles(directory=str(audio_dir)), name="audio")

# Pydantic models for request/response validation
class ChatMessage(BaseModel):
    message: str
    file_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    segments: Optional[List[dict]] = None

class Podcast(BaseModel):
    id: str
    title: str
    file_path: str
    summary: Optional[str] = None
    duration: Optional[str] = None

# Initialize LlamaNodeConnector
llama_connector = LlamaNodeConnector()

@app.get("/")
async def root():
    return {"message": "SuperPod API is running"}

@app.get("/podcasts", response_model=List[Podcast])
async def get_podcasts():
    """Get all available podcasts with metadata"""
    podcasts = []
    audio_files_dir = Path(__file__).parent / "audio_files"
    summaries_dir = Path(__file__).parent / "summaries"
    
    if not audio_files_dir.exists():
        return podcasts
    
    for audio_file in audio_files_dir.glob("*.mp3"):
        podcast_id = audio_file.stem
        title = f"Podcast {podcast_id.replace('audio_', '')}"
        
        # Try to get summary if available
        summary = None
        summary_file = summaries_dir / f"{podcast_id}_transcript_summary.json"
        if summary_file.exists():
            try:
                with open(summary_file, 'r') as f:
                    summary_data = json.load(f)
                    summary = summary_data.get('summary', '')
            except:
                pass
        
        podcasts.append(Podcast(
            id=podcast_id,
            title=title,
            file_path=f"/audio/{audio_file.name}",
            summary=summary,
            duration="Unknown"
        ))
    
    return podcasts

@app.post("/chat/message", response_model=ChatResponse)
async def chat_message(message: ChatMessage):
    """Process chat messages through Q&A agent"""
    try:
        # Format the request to include file context if provided
        if message.file_id:
            # Include file context in the message for the workflow orchestrator
            formatted_message = f"Context: audio_{message.file_id}. {message.message}"
        else:
            formatted_message = message.message
            
        response = llama_connector.process_client_request(formatted_message)
        
        # Handle response formatting
        if isinstance(response, str):
            try:
                response_data = json.loads(response)
                return ChatResponse(
                    response=response_data.get('response', response),
                    segments=response_data.get('segments', [])
                )
            except json.JSONDecodeError:
                return ChatResponse(response=response)
        else:
            # Handle dict response from workflow orchestrator
            if isinstance(response, dict):
                if response.get('source') == 'workflow_orchestrator':
                    result = response.get('result', {})
                    if isinstance(result, dict):
                        answer = result.get('answer', str(result))
                        return ChatResponse(
                            response=answer,
                            segments=result.get('segments', [])
                        )
                    else:
                        return ChatResponse(response=str(result))
                else:
                    return ChatResponse(
                        response=str(response),
                        segments=response.get('segments', [])
                    )
            else:
                return ChatResponse(
                    response=str(response),
                    segments=getattr(response, 'segments', [])
                )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat processing error: {str(e)}")

@app.get("/audio/{file_id}")
async def get_audio(file_id: str):
    """Serve audio files"""
    audio_file = Path(__file__).parent / "audio_files" / f"{file_id}.mp3"
    
    if not audio_file.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    return FileResponse(
        path=str(audio_file),
        media_type="audio/mpeg",
        filename=f"{file_id}.mp3"
    )

@app.get("/transcript/{file_id}")
async def get_transcript(file_id: str):
    """Get transcription data for audio file"""
    transcript_file = Path(__file__).parent / "transcriptions" / f"{file_id}_transcript.json"
    
    if not transcript_file.exists():
        raise HTTPException(status_code=404, detail="Transcript not found")
    
    try:
        with open(transcript_file, 'r') as f:
            transcript_data = json.load(f)
        return transcript_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading transcript: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 