import requests
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
                    "temperature": 0,       # deterministic JSON output
                    "num_predict": 4096,    # enough for full resume JSON
                    "top_p": 1,
                    "repeat_penalty": 1.0,
                }
            },
            timeout=120  # don't hang forever
        )

        data = response.json()
        print("Ollama RAW response:", data)

        if "response" in data:
            return data["response"]
        else:
            return json.dumps(data)

    except requests.exceptions.Timeout:
        return json.dumps({"error": "Ollama timed out"})
    except Exception as e:
        return json.dumps({"error": str(e)})