import requests
from langchain.llms import OpenAI
import os
from llama_api_client import LlamaAPIClient
from PlayPauseAgent import PlayPauseAgent  # Assuming PlayPauseAgent is defined in PlayPauseAgent.py

class LlamaNodeConnector:

    def __init__(self):
        self.llama_client = LlamaAPIClient(
            api_key=os.environ.get("LLAMA_API_KEY")
        )
        self.model = "Llama-4-Maverick-17B-128E-Instruct-FP8"

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
                }
        ],
        )
        return llama_response
    def call_pause_play_agent(self, audioid, user_message):
        """
        Calls the PausePlayAgent with the given prompt.
        
        Args:
            prompt (str): The input prompt for the PausePlayAgent.
        
        Returns:
            dict: The response from the PausePlayAgent.
        """
        # Assuming PausePlayAgent is defined elsewhere and imported
        playpauseagent = PlayPauseAgent()
        return playpauseagent.find_and_play_audio(self.llama_client, audioid, user_message)