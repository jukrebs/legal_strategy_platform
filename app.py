from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
from openai import OpenAI
from dotenv import load_dotenv
import sys
from pathlib import Path
from io import BytesIO

load_dotenv()

app = Flask(__name__)
CORS(app)

# Add backend directory to path for imports
backend_path = Path(__file__).parent / 'backend'
sys.path.insert(0, str(backend_path))

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Load case data
def load_cases():
    """Load cases from the JSON file"""
    data_path = os.path.join(os.path.dirname(__file__), 'data', 'reckless_driving_cases.json')
    with open(data_path, 'r') as f:
        return json.load(f)

@app.route('/api/similar-cases', methods=['GET'])
def get_similar_cases():
    """Get top 5 similar cases"""
    try:
        cases = load_cases()
        # Return top 5 cases (or all if less than 5)
        top_cases = cases[:5]
        
        # Format the response to match frontend expectations
        formatted_cases = []
        for case in top_cases:
            formatted_cases.append({
                'id': str(case.get('cluster_id', '')),
                'caseName': case.get('caseName', ''),
                'date': case.get('dateFiled', ''),
                'judge': case.get('judge', ''),
                'syllabus': case.get('syllabus', ''),
                'court': case.get('court', ''),
                'url': case.get('absolute_url', '')
            })
        
        return jsonify({
            'success': True,
            'cases': formatted_cases
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/generate-strategies', methods=['POST'])
def generate_strategies():
    """Generate defense strategies based on selected cases using OpenAI"""
    try:
        data = request.json
        selected_cases = data.get('cases', [])
        
        if not selected_cases:
            return jsonify({
                'success': False,
                'error': 'No cases provided'
            }), 400
        
        # Build prompt from selected cases
        prompt = "You are a legal strategy expert. Based on the following similar legal cases, generate exactly 3 recommended defense strategies.\n\n"
        prompt += "Similar Cases:\n\n"
        
        for i, case in enumerate(selected_cases, 1):
            prompt += f"Case {i}: {case.get('caseName', '')}\n"
            prompt += f"Date: {case.get('date', '')}\n"
            prompt += f"Judge: {case.get('judge', '')}\n"
            prompt += f"Court: {case.get('court', '')}\n"
            prompt += f"Summary: {case.get('syllabus', '')}\n\n"
        
        prompt += "\nFor each defense strategy, provide:\n"
        prompt += "1. Title: A clear, concise name for the strategy\n"
        prompt += "2. Advantages: List of key benefits and strengths\n"
        prompt += "3. Considerations: Important factors to consider\n"
        prompt += "4. Risk Flags: Potential risks or challenges\n"
        prompt += "5. Supporting Precedent & Strategy Applications: Which of the provided cases support this strategy and how\n"
        
        # Call OpenAI API with structured output
        response = client.chat.completions.create(
            model="gpt-4o-2024-08-06",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert legal strategist who analyzes case precedents to develop effective defense strategies."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "defense_strategies",
                    "strict": True,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "strategies": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "title": {
                                            "type": "string",
                                            "description": "The name of the defense strategy"
                                        },
                                        "advantages": {
                                            "type": "array",
                                            "items": {
                                                "type": "string"
                                            },
                                            "description": "List of advantages for this strategy"
                                        },
                                        "considerations": {
                                            "type": "array",
                                            "items": {
                                                "type": "string"
                                            },
                                            "description": "Important considerations for this strategy"
                                        },
                                        "risk_flags": {
                                            "type": "array",
                                            "items": {
                                                "type": "string"
                                            },
                                            "description": "Potential risks and challenges"
                                        },
                                        "supporting_precedents": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "case_name": {
                                                        "type": "string",
                                                        "description": "Name of the supporting case"
                                                    },
                                                    "application": {
                                                        "type": "string",
                                                        "description": "How this case supports the strategy"
                                                    }
                                                },
                                                "required": ["case_name", "application"],
                                                "additionalProperties": False
                                            },
                                            "description": "Cases that support this strategy"
                                        }
                                    },
                                    "required": ["title", "advantages", "considerations", "risk_flags", "supporting_precedents"],
                                    "additionalProperties": False
                                }
                            }
                        },
                        "required": ["strategies"],
                        "additionalProperties": False
                    }
                }
            }
        )
        
        # Parse the response
        result = json.loads(response.choices[0].message.content)
        strategies = result.get('strategies', [])
        
        # Format strategies for frontend
        formatted_strategies = []
        for i, strategy in enumerate(strategies[:3], 1):  # Ensure only 3 strategies
            formatted_strategies.append({
                'id': f'strategy-{i}',
                'title': strategy.get('title', ''),
                'advantages': strategy.get('advantages', []),
                'considerations': strategy.get('considerations', []),
                'riskFlags': strategy.get('risk_flags', []),
                'supportingPrecedents': [
                    {
                        'caseName': prec.get('case_name', ''),
                        'application': prec.get('application', '')
                    }
                    for prec in strategy.get('supporting_precedents', [])
                ]
            })
        
        return jsonify({
            'success': True,
            'strategies': formatted_strategies
        })
        
    except Exception as e:
        print(f"Error generating strategies: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)

