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

@app.route('/api/upload-case', methods=['POST'])
def upload_case():
    """Upload PDF(s), extract text, and query Weaviate for similar cases"""
    try:
        # Check if files were uploaded
        if 'files' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No files provided'
            }), 400
        
        files = request.files.getlist('files')
        if not files or len(files) == 0:
            return jsonify({
                'success': False,
                'error': 'No files provided'
            }), 400
        
        # Import PDF extraction library
        try:
            from pypdf import PdfReader
        except ImportError:
            try:
                from PyPDF2 import PdfReader
            except ImportError:
                return jsonify({
                    'success': False,
                    'error': 'PDF processing library not installed'
                }), 500
        
        # Extract text from all PDFs
        extracted_text = []
        for file in files:
            if file.filename.lower().endswith('.pdf'):
                try:
                    pdf_bytes = BytesIO(file.read())
                    reader = PdfReader(pdf_bytes)
                    
                    # Extract text from all pages
                    for page in reader.pages:
                        text = page.extract_text()
                        if text:
                            extracted_text.append(text.strip())
                except Exception as e:
                    print(f"Error extracting text from {file.filename}: {str(e)}")
                    continue
        
        if not extracted_text:
            return jsonify({
                'success': False,
                'error': 'No text could be extracted from the uploaded PDFs'
            }), 400
        
        # Combine all extracted text
        combined_text = "\n\n".join(extracted_text)
        
        # Import Weaviate search functionality
        from weaviate_cases import (
            build_connection_options,
            connect_weaviate_client,
            load_config_file,
            derive_query_via_reasoning
        )
        
        # Load config
        config_path = Path(__file__).parent / 'config.yaml'
        config = load_config_file(config_path)
        
        # Get connection options
        connection_opts = build_connection_options(config)
        
        # Generate query using reasoning
        query_text = derive_query_via_reasoning(
            combined_text,
            connection=connection_opts,
            model=config.get('search', {}).get('reasoning_model'),
            effort=config.get('search', {}).get('reasoning_effort', 'low'),
            api_base=config.get('search', {}).get('reasoning_api_base')
        )
        
        print(f"Generated query: {query_text}")
        
        # Connect to Weaviate and search
        client = connect_weaviate_client(connection_opts)
        try:
            collection_name = config.get('collection', {}).get('name', 'RecklessDisorderlyMock')
            collection = client.collections.get(collection_name)
            
            # Import MetadataQuery
            from weaviate.classes.query import MetadataQuery
            
            # Perform search with top_k=5
            response = collection.query.near_text(
                query=query_text,
                limit=5,
                return_properties=["case_id", "title", "body", "metadata", "source_file", "absolute_url", "judge"],
                return_metadata=MetadataQuery(distance=True, certainty=True)
            )
            
            if not response.objects:
                return jsonify({
                    'success': True,
                    'cases': [],
                    'extracted_text': combined_text[:500],  # First 500 chars for reference
                    'query': query_text
                })
            
            # Format results
            results = []
            for rank, obj in enumerate(response.objects, start=1):
                properties = obj.properties or {}
                metadata_obj = getattr(obj, "metadata", None)
                
                case_data = {
                    'rank': rank,
                    'case_id': str(properties.get('case_id', obj.uuid)),
                    'uuid': str(obj.uuid) if obj.uuid else None,
                    'title': properties.get('title', ''),
                    'body': properties.get('body', ''),
                    'source_file': properties.get('source_file', ''),
                    'distance': float(metadata_obj.distance) if metadata_obj and hasattr(metadata_obj, 'distance') else None,
                    'certainty': float(metadata_obj.certainty) if metadata_obj and hasattr(metadata_obj, 'certainty') else None,
                    'absolute_url': properties.get('absolute_url', ''),
                    'judge': properties.get('judge', '')
                }
                
                # Parse metadata JSON if present
                if properties.get('metadata'):
                    try:
                        case_data['metadata'] = json.loads(properties['metadata'])
                    except json.JSONDecodeError:
                        case_data['metadata'] = properties['metadata']
                
                results.append(case_data)
            
            return jsonify({
                'success': True,
                'cases': results,
                'extracted_text': combined_text[:500],  # First 500 chars for reference
                'query': query_text
            })
            
        finally:
            try:
                client.close()
            except AttributeError:
                pass
                
    except Exception as e:
        print(f"Error in upload_case: {str(e)}")
        import traceback
        traceback.print_exc()
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

