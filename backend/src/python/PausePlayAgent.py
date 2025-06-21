import requests
from langchain.llms import OpenAI
import os
from llama_api_client import LlamaAPIClient

class LlamaAPIClient:

    client = LlamaAPIClient()

    response = client.chat.completions.create(
        messages=[

        ],
        model="Llama-4-Scout-17B-16E-Instruct-FP8",
        stream=True,
        temperature=0.6,
        max_completion_tokens=2048,
        top_p=0.9,
        repetition_penalty=1,
        tools=[
        ],
    )

    for chunk in response:
        print(chunk)
    def __init__(self, api_url, api_key):
        self.api_url = api_url
        self.api_key = api_key

    def call_llama(self, prompt):
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        payload = {
            'prompt': prompt,
            'max_tokens': 150
        }
        response = requests.post(self.api_url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json().get('text', '')

class PausePlayAgent:
    def __init__(self, llama_api_url, llama_api_key):
        self.llama_client = LlamaAPIClient(llama_api_url, llama_api_key)
        self.langchain_llm = OpenAI(model_name="text-davinci-003")

    def process_with_llama(self, prompt):
        llama_response = self.llama_client.call_llama(prompt)
        return llama_response

    def process_with_langchain(self, prompt):
        langchain_response = self.langchain_llm(prompt)
        return langchain_response