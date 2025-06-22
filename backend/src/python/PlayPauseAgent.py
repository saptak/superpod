import requests
import os
from llama_api_client import LlamaAPIClient
from chromadb import Client as ChromaClient
from chromadb.config import Settings


class PlayPauseAgent:

    def find_and_play_audio(self, llama_client, audioid, user_message):
        """
        Finds and plays an audio based on the provided query.
        
        Args:
            query (str): The search query for the audio.
        
        Returns:
            dict: The response containing audio details or an error message.
        """
        # Placeholder for actual implementation
        chroma_client = ChromaClient(Settings(chroma_db_impl="duckdb+parquet", persist_directory="./chroma_db"))
        collection = chroma_client.get_collection("audio_collection")
        audio_segments = collection.query(
            query_texts=[audioid],
            n_results=1
        )

        llama_response = llama_client.chat.completions.create(
            messages=[{
                "role": "system",
                "content": "You are a helpful assistant that finds and plays audio based on user queries. You find all matching segments based on user queries and return all of them."
            },
            {
                "role": "user", 
                "content": "Look at all the audio segments and find the audio that matches the query: " + user_message + 
                "Here is the list of all audio segments: " + str(audio_segments["documents"]) +
                "Find earliest start time from all segments and latest end time from all segments. Return this information in JSON format with keys 'audio_id', 'start_time' and 'end_time'."
            }],
            model="Llama-4-Maverick-17B-128E-Instruct-FP8",
            stream=False,
            temperature=0.6,
            max_completion_tokens=2048,
            top_p=0.9,
            repetition_penalty=1
        )

        if not audio_segments or not audio_segments[0] or not audio_segments["documents"]:
            return {"status": "error", "message": "Audio not found"}
        

        return llama_response