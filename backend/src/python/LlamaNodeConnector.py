import requests
import os
from llama_api_client import LlamaAPIClient
from PlayPauseAgent import PlayPauseAgent
from summarization_agent import SummarizationAgent
from qa_agent import QAAgent
from transcription_agent import TranscriptionAgent

class LlamaNodeConnector:

    def __init__(self):
        self.llama_client = LlamaAPIClient(
            api_key=os.environ.get("LLAMA_API_KEY")
        )
        self.model = "Llama-4-Maverick-17B-128E-Instruct-FP8"
        
        # Initialize only transcription agent by default
        # self.transcription_agent = TranscriptionAgent()
        print("TranscriptionAgent initialized and ready")

    def process_client_request(self, prompt):
        """
        Processes the client request using the Llama API.
        
        Args:
            prompt (str): The input prompt for the Llama model.
        
        Returns:
            dict: The response from the Llama API.
        """
        llama_response = self.llama_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that looks at user message and categorize it in one of the following categories: 'summarization', 'question_answering', 'audio_playback', 'audio_search'. If the user message is about audio playback, you will call the PausePlayAgent to find and play the audio." +
                    "You will return the response in JSON format with keys 'category' and 'response'. "
                },
                {
                    "role": "user", 
                    "content": prompt
                 }
                ],
            model=self.model,
            stream=False,
            temperature=0.6,
            max_completion_tokens=2048,
            top_p=0.9,
            repetition_penalty=1,
            tools=[
                {
                    "type": "function",
                    "function": {
                        "name": "call_pause_play_agent",
                        "description": "Retrieve the current temperature for a specified location",
                        "parameters": {
                        "properties": {
                            "location": {
                            "type": "string",
                            "description": "find audio and relevant segments based on user query, use it to find start and end times of audio."
                            }
                        },
                        "required": ["audioid","user_message"]
                        }
                    }
                },
                 {
                    "type": "function",
                    "function": {
                        "name": "call_summarization_agent",
                        "description": "Generate summaries of podcast transcripts",
                        "parameters": {
                        "properties": {
                            "transcript_file": {
                            "type": "string",
                            "description": "Path to the transcript file to summarize."
                            }
                        },
                        "required": ["transcript_file","output_dir"]
                        }
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "call_qa_agent",
                        "description": "Answer questions about podcast content",
                        "parameters": {
                        "properties": {
                            "question": {
                            "type": "string",
                            "description": "Question to ask about the podcast."
                            }
                        },
                        "required": ["question","transcript_file","summary_file"]
                        }
                    }
                },
        ],
        )
        return llama_response.completion_message.content.text

    def call_transcription_agent(self, audio_file_path, output_dir):
        """
        Calls the TranscriptionAgent with the given parameters.
        
        Args:
            audio_file_path (str): Path to the audio file.
            output_dir (str): Directory to save the transcript.
        
        Returns:
            dict: The response from the TranscriptionAgent.
        """
        # Using the initialized transcription agent instance
        success = self.transcription_agent.process(audio_file_path, output_dir)
        if success:
            return {
                "status": "success",
                "message": f"Successfully transcribed {audio_file_path}",
                "output_dir": output_dir
            }
        else:
            return {
                "status": "error",
                "message": f"Failed to transcribe {audio_file_path}"
            }

    def call_pause_play_agent(self, audioid, user_message):
        """
        Calls the PausePlayAgent with the given prompt.
        
        Args:
            prompt (str): The input prompt for the PausePlayAgent.
        
        Returns:
            dict: The response from the PausePlayAgent.
        """
        # Create new instance when called
        playpauseagent = PlayPauseAgent()
        return playpauseagent.find_and_play_audio(self.llama_client, audioid, user_message)

    def call_summarization_agent(self, transcript_file, output_dir):
        """
        Calls the SummarizationAgent with the given prompt.
        
        Args:
            prompt (str): The input prompt for the SummarizationAgent.
        
        Returns:
            dict: The response from the SummarizationAgent.
        """
        # Create new instance when called
        summarizationagent = SummarizationAgent()
        return summarizationagent.process(transcript_file, output_dir)

    def call_qa_agent(self, question, transcript_file, summary_file):
        """
        Calls the QAAgent with the given prompt.
        
        Args:
            prompt (str): The input prompt for the QAAgent.
        
        Returns:
            dict: The response from the QAAgent.
        """
        # Create new instance when called
        qaagent = QAAgent()
        qaagent.load_data(transcript_file, summary_file)
        return qaagent.ask_question(question)