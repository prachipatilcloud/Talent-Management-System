import requests
from fastapi import FastAPI, UploadFile, File
import json

def call_ollama(prompt):
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "mistral:7b",
                "prompt": prompt,
                "stream": False,    
                "options": {
                  "temperature": 1,
                  "num_predict": 2048
                }
            }
        )

        data = response.json()

        print("Ollama RAW response:", data)  # DEBUG

        if "response" in data:
            return data["response"]
        else:
            return json.dumps(data)

    except Exception as e:
        return json.dumps({"error": str(e)})
