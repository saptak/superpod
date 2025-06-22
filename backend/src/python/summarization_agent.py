"""
Summarization Agent
Generates comprehensive podcast summaries using Llama AI
"""
import json
import os
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime
from llama_api_client import LlamaAPIClient

class SummarizationAgent:
    """Agent for generating podcast summaries"""
    
    def __init__(self):
        self.client = None
        self.logger = self._setup_logger()
        # Set up default directories
        self.base_dir = Path(__file__).parent.parent.parent.parent  # Go up to project root
        self.transcriptions_dir = self.base_dir / "transcriptions"
        self.summaries_dir = self.base_dir / "summaries"
        
    def _setup_logger(self):
        """Setup logging for the agent"""
        logger = logging.getLogger("SummarizationAgent")
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
            handler.setFormatter(formatter)
            logger.addHandler(handler)
            logger.setLevel(logging.INFO)
        return logger
        
    def _get_timestamp(self) -> str:
        """Get current timestamp in ISO format"""
        return datetime.now().isoformat()
        
    def _initialize_client(self) -> bool:
        """Initialize Llama API client"""
        try:
            api_key = os.getenv("LLAMA_API_KEY")
            if not api_key:
                self.logger.error("LLAMA_API_KEY not found in environment")
                return False
                
            self.client = LlamaAPIClient(api_key=api_key)
            self.logger.info("Llama API client initialized successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to initialize Llama client: {e}")
            return False
    
    def get_transcript_files(self):
        """Get list of available transcript files"""
        transcript_files = []
        if self.transcriptions_dir.exists():
            for file in self.transcriptions_dir.iterdir():
                if file.is_file() and file.suffix.lower() == '.json':
                    transcript_files.append({
                        'name': file.name,
                        'path': str(file),
                        'size': file.stat().st_size
                    })
        return transcript_files
    
    def _load_transcript(self, file_path: str) -> Optional[Dict[str, Any]]:
        """Load transcript data from JSON file"""
        try:
            path = Path(file_path)
            if not path.is_file():
                self.logger.error(f"Transcript file not found: {file_path}")
                return None
                
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            self.logger.info(f"Transcript loaded: {len(data.get('segments', []))} segments")
            return data
            
        except json.JSONDecodeError as e:
            self.logger.error(f"Invalid JSON in transcript file: {e}")
            return None
        except Exception as e:
            self.logger.error(f"Error loading transcript: {e}")
            return None
    
    def _create_summary_prompt(self, transcript_data: Dict[str, Any]) -> str:
        """Create comprehensive prompt for Llama to analyze the podcast"""
        segments = transcript_data.get('segments', [])
        full_text = transcript_data.get('full_text') or ' '.join(seg['text'] for seg in segments)
        metadata = transcript_data.get('metadata', {})

        total_duration = metadata.get('duration', 0)
        num_segments = len(segments)
        avg_segment_length = sum(len(seg['text']) for seg in segments) / max(num_segments, 1)

        # Default prompt template if config is not available
        prompt_template = """You are an expert podcast analyst. Please provide a comprehensive summary of the following podcast transcript.

PODCAST INFORMATION:
- Duration: {duration_minutes:.1f} minutes ({total_duration:.1f} seconds)
- Number of segments: {num_segments}
- Average segment length: {avg_segment_length:.1f} characters
- Language: {language}

TRANSCRIPT:
{full_text}

Please provide a detailed summary that includes:
1. Main topics and themes discussed
2. Key insights and takeaways
3. Important quotes or statements
4. Overall tone and style of the podcast
5. Target audience and purpose

Make the summary engaging and informative while maintaining accuracy to the original content."""

        return prompt_template.format(
            total_duration=total_duration,
            duration_minutes=total_duration/60,
            num_segments=num_segments,
            avg_segment_length=avg_segment_length,
            language=metadata.get('language', 'Unknown'),
            full_text=full_text
        )
    
    def _extract_key_moments(self, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract key moments from transcript segments"""
        key_moments = []
        # Default keywords for key moments
        keywords = ["important", "key", "main", "primary", "significant", "crucial", "essential"]

        for segment in segments:
            text = segment['text'].strip()
            start_ms = int(segment.get('start_ms') or segment.get('start', 0) * 1000)
            end_ms = int(segment.get('end_ms') or segment.get('end', 0) * 1000)

            # Check if segment is significant
            if (len(text) > 100 or 
                any(keyword in text.lower() for keyword in keywords)):
                
                key_moments.append({
                    "timestamp": f"{start_ms/1000:.1f}s - {end_ms/1000:.1f}s",
                    "start_ms": start_ms,
                    "text": text[:200] + "..." if len(text) > 200 else text
                })

        return key_moments[:10]  # Return top 10 moments
    
    def _get_summary_stream(self, prompt: str) -> str:
        """Get streaming summary from Llama API"""
        try:
            # Default model settings if config is not available
            model = os.getenv("LLAMA_MODEL", "llama-3.1-8b-instruct")
            temperature = float(os.getenv("LLAMA_TEMPERATURE", "0.6"))
            max_tokens = int(os.getenv("LLAMA_MAX_TOKENS", "2048"))
            
            self.logger.info(f"Generating summary with model: {model}")
            
            response = self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=model,
                stream=True,
                temperature=temperature,
                max_completion_tokens=max_tokens,
                top_p=0.9,
                repetition_penalty=1,
                tools=[]
            )

            collected_text = ""
            for chunk in response:
                delta_content = ""
                
                # Handle different response patterns
                if hasattr(chunk, 'event') and hasattr(chunk.event, 'delta') and hasattr(chunk.event.delta, 'text'):
                    delta_content = chunk.event.delta.text or ''
                elif hasattr(chunk, 'choices') and chunk.choices:
                    choice = chunk.choices[0]
                    if hasattr(choice, 'delta') and choice.delta:
                        delta_content = getattr(choice.delta, 'content', '') or ''
                elif hasattr(chunk, 'content'):
                    delta_content = chunk.content or ''
                else:
                    try:
                        chunk_dict = chunk.model_dump() if hasattr(chunk, 'model_dump') else chunk.__dict__
                        if 'choices' in chunk_dict and chunk_dict['choices']:
                            choice = chunk_dict['choices'][0]
                            if 'delta' in choice and choice['delta'] and 'content' in choice['delta']:
                                delta_content = choice['delta']['content'] or ''
                    except:
                        pass
                
                if delta_content:
                    print(delta_content, end="", flush=True)
                    collected_text += delta_content

            return collected_text
            
        except Exception as e:
            self.logger.error(f"Error during summary generation: {e}")
            return f"Error generating summary: {str(e)}"
    
    def _save_summary(self, summary_data: Dict[str, Any], output_path: str) -> bool:
        """Save summary to JSON file"""
        try:
            output_file_path = Path(output_path)
            output_file_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(output_file_path, 'w', encoding='utf-8') as f:
                json.dump(summary_data, f, indent=2, ensure_ascii=False)
            
            self.logger.info(f"Summary saved to: {output_path}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to save summary: {e}")
            return False
    
    def process(self, transcript_file: str, output_dir: str = None) -> bool:
        """Process transcript and generate summary"""
        try:
            print(f"Starting podcast summarization...")
            print(f"Transcript: {Path(transcript_file).name}")
            
            # Set default output directory if not provided
            if output_dir is None:
                output_dir = str(self.summaries_dir)
            
            # Initialize client
            if not self._initialize_client():
                return False
            
            # Load transcript
            transcript_data = self._load_transcript(transcript_file)
            if not transcript_data:
                return False
            
            # Create output directory
            output_path = Path(output_dir)
            output_path.mkdir(parents=True, exist_ok=True)
            
            # Generate summary
            print(f"\nGenerating summary...")
            prompt = self._create_summary_prompt(transcript_data)
            summary = self._get_summary_stream(prompt)
            
            # Extract key moments
            key_moments = self._extract_key_moments(transcript_data.get('segments', []))
            
            # Prepare summary data
            base_name = Path(transcript_file).stem
            summary_data = {
                "metadata": {
                    "transcript_file": transcript_file,
                    "model_used": os.getenv("LLAMA_MODEL", "llama-3.1-8b-instruct"),
                    "created_at": self._get_timestamp(),
                    "agent": "SummarizationAgent",
                    "agent_type": "summarization",
                    "provider": "Llama",
                    "version": "1.0.0"
                },
                "podcast_info": {
                    "duration_seconds": transcript_data['metadata'].get('duration', 0),
                    "duration_minutes": transcript_data['metadata'].get('duration', 0) / 60,
                    "language": transcript_data['metadata'].get('language', 'Unknown'),
                    "total_segments": len(transcript_data.get('segments', [])),
                    "total_text_length": len(transcript_data.get('full_text', ''))
                },
                "summary": summary,
                "key_moments": key_moments,
                "full_transcript": transcript_data.get('full_text', '')
            }
            
            # Save summary
            output_file = output_path / f"{base_name}_summary.json"
            success = self._save_summary(summary_data, str(output_file))
            
            if success:
                print(f"\nSummary completed!")
                print(f"Key moments: {len(key_moments)}")
                print(f"Saved to: {output_file}")
                
            return success
            
        except Exception as e:
            self.logger.error(f"Summarization process failed: {e}")
            print(f"\nSummarization failed: {e}")
            return False 