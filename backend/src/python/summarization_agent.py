"""
Summarization Agent
Generates comprehensive podcast summaries using Llama AI
"""
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from llama_api_client import LlamaAPIClient

from .base import BaseAgent

class SummarizationAgent(BaseAgent):
    """Agent for generating podcast summaries"""
    
    def __init__(self):
        super().__init__("summarization")
        self.client = None
        
    def _initialize_client(self) -> bool:
        """Initialize Llama API client"""
        try:
            api_key = self.config.get_env("LLAMA_API_KEY")
            if not api_key:
                self.logger.error("LLAMA_API_KEY not found in environment")
                return False
                
            self.client = LlamaAPIClient(api_key=api_key)
            self.logger.info("Llama API client initialized successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to initialize Llama client: {e}")
            return False
    
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

        # Get prompt template from config
        prompt_template = self.config.get('summarization.prompt_template')
        
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
        keywords = self.config.get('summarization.key_moment_keywords', [])

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
            model = self.config.get('summarization.model')
            temperature = self.config.get('summarization.temperature', 0.6)
            max_tokens = self.config.get('summarization.max_tokens', 2048)
            
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
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(summary_data, f, indent=2, ensure_ascii=False)
            
            self.logger.info(f"Summary saved to: {output_path}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to save summary: {e}")
            return False
    
    def process(self, transcript_file: str, output_dir: str = "summaries") -> bool:
        """Process transcript and generate summary"""
        try:
            print(f"Starting podcast summarization...")
            print(f"Transcript: {Path(transcript_file).name}")
            
            # Initialize client
            if not self._initialize_client():
                return False
            
            # Load transcript
            transcript_data = self._load_transcript(transcript_file)
            if not transcript_data:
                return False
            
            # Create output directory
            output_path = Path(output_dir)
            output_path.mkdir(exist_ok=True)
            
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
                    "model_used": self.config.get('summarization.model'),
                    "created_at": self._get_timestamp()
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