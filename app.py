from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
from openai import OpenAI
from dotenv import load_dotenv
import sys
from pathlib import Path
from io import BytesIO
import requests
import time
import uuid

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

# Load judge characteristics
def load_judge_characteristics():
    """Load judge characteristics from JSON file"""
    data_path = os.path.join(os.path.dirname(__file__), 'data', 'judge_characteristics.json')
    with open(data_path, 'r') as f:
        return json.load(f)

# Load state attorney characteristics
def load_state_attorney_characteristics():
    """Load state attorney characteristics from JSON file"""
    data_path = os.path.join(os.path.dirname(__file__), 'data', 'stateattorney_characteristics.json')
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

@app.route('/api/run-simulations', methods=['POST'])
def run_simulations():
    """Run multiple simulations for each strategy using n8n webhook"""
    try:
        data = request.json
        strategies = data.get('strategies', [])
        case_facts = data.get('caseFacts', '')
        extracted_text = data.get('extractedText', '')
        judge_name = data.get('judgeName', '')
        state_attorney_name = data.get('stateAttorneyName', '')
        
        if not strategies:
            return jsonify({
                'success': False,
                'error': 'No strategies provided'
            }), 400
        
        # Load judge and state attorney characteristics
        judge_chars = load_judge_characteristics()
        state_attorney_chars = load_state_attorney_characteristics()
        
        # n8n webhook URL
        n8n_url = "https://juliuspor.app.n8n.cloud/webhook/bfda8a16-0260-4297-ab36-a707e54323c2"
        
        # Store results
        simulation_results = []
        
        # For each strategy, run 3 simulations
        for strategy_idx, strategy in enumerate(strategies):
            strategy_id = strategy.get('id', f'strategy-{strategy_idx + 1}')
            strategy_title = strategy.get('title', '')
            
            strategy_runs = []
            
            # Run 3 simulations per strategy
            for run_idx in range(3):
                run_id = f"{strategy_id}-run-{run_idx + 1}"
                variation = "Standard Approach" if run_idx == 0 else \
                           "Aggressive Variant" if run_idx == 1 else \
                           "Conservative Variant"
                
                # Build the case context with all relevant information
                case_context = f"""
Case Facts:
{case_facts}

Extracted Case Documents:
{extracted_text[:1000] if extracted_text else 'No additional documents provided'}

Judge: {judge_chars.get('name', 'Hon. Sarah Mitchell')}
Court: {judge_chars.get('court', 'EDNY/SDNY')}

State Attorney: {state_attorney_chars.get('name', 'James Anderson')}
Firm: {state_attorney_chars.get('firm', 'Office of the State Attorney')}
"""
                
                # Build lawyer prompt (defense) based on strategy and case
                lawyer_prompt = f"""
You are the defense attorney representing the defendant in this case.

CASE DETAILS:
{case_context}

DEFENSE STRATEGY TO EMPLOY:
{strategy_title}

Strategy Details:
- Advantages: {', '.join(strategy.get('advantages', [])[:3])}
- Key Approach: {strategy.get('advantages', [''])[0] if strategy.get('advantages') else ''}

VARIATION: {variation}
{"- Focus on aggressive cross-examination and forceful arguments." if variation == "Aggressive Variant" else 
 "- Focus on measured, procedural arguments and risk mitigation." if variation == "Conservative Variant" else
 "- Use a balanced approach combining legal precedent with factual analysis."}

Your role is to present a compelling legal defense using this strategy. Argue forcefully for dismissal or reduced liability.
Present your argument professionally and persuasively, citing relevant legal principles where appropriate.
"""

                # Build opponent prompt (state attorney) based on characteristics
                opponent_prompt = f"""
You are the State Attorney representing the plaintiff in this lawsuit.

CASE DETAILS:
{case_context}

YOUR PROFILE:
- Aggressiveness Level: {state_attorney_chars.get('aggressiveness', 8.5)}/10
- Win Rate: {state_attorney_chars.get('plaintiffSuccessRate', 72.5)}%
- Approach: {state_attorney_chars.get('emotionalProfile', {}).get('communicationStyle', 'Direct and Confrontational')}
- Settlement Willingness: {state_attorney_chars.get('emotionalProfile', {}).get('opennessToSettlement', 25)}% (Low)

KEY STRENGTHS:
{chr(10).join(f"- {s.get('area', '')}: {s.get('note', '')}" for s in state_attorney_chars.get('strengths', [])[:3])}

TACTICAL APPROACH:
{chr(10).join(f"- {t}" for t in state_attorney_chars.get('tacticalProfile', {}).get('commonTactics', [])[:3])}

Your role is to aggressively prosecute this case on behalf of the plaintiff. Present compelling arguments for liability
and maximum damages. Challenge the defense's arguments forcefully and cite precedent to support the plaintiff's position.
"""

                # Build judge prompt based on characteristics
                judge_prompt = f"""
You are {judge_chars.get('name', 'Hon. Sarah Mitchell')}, presiding judge for {judge_chars.get('court', 'EDNY/SDNY')}.

CASE DETAILS:
{case_context}

YOUR JUDICIAL PROFILE:
- Pleading Strictness: {judge_chars.get('pleadingStrictness', 8.5)}/10
- Precedent Weight: {judge_chars.get('precedentWeight', 9.0)}/10
- Policy Receptivity: {judge_chars.get('policyReceptivity', 2.0)}/10
- Plaintiff Friendly: {judge_chars.get('plaintiffFriendly', 8.0)}/10

TEMPERAMENT: {judge_chars.get('emotionalProfile', {}).get('temperament', 'Methodical')}
- Patience: {judge_chars.get('emotionalProfile', {}).get('patience', 55)}/100
- Openness to Novel Arguments: {judge_chars.get('emotionalProfile', {}).get('opennessToNovelArguments', 15)}/100
- Plaintiff Sympathy: {judge_chars.get('emotionalProfile', {}).get('sympathy', {}).get('plaintiff', 80)}%
- Defendant Sympathy: {judge_chars.get('emotionalProfile', {}).get('sympathy', {}).get('defendant', 20)}%

STRICT AREAS:
{chr(10).join(f"- {a.get('area', '')}: {a.get('level', 0)}/10 - {a.get('note', '')}" for a in judge_chars.get('strictAreas', [])[:3])}

INSTRUCTIONS:
1. Call both the defense lawyer (LawyerAgent) and state attorney (OpponentAgent) to hear their arguments
2. Consider each argument carefully based on your judicial philosophy and characteristics
3. Make a verdict determining the winner (Plaintiff or Defense) 
4. Provide a judgment summary explaining your reasoning

Your decision should reflect your judicial tendencies, particularly your:
- High precedent weight (strongly favor established case law)
- High pleading strictness (demand rigorous legal standards)
- Plaintiff-friendly bias ({judge_chars.get('plaintiffFriendly', 8.0)}/10)
- Low openness to novel arguments
"""

                # Call n8n webhook
                try:
                    session_id = f"session-{uuid.uuid4()}"
                    
                    payload = {
                        "lawyer_prompt": lawyer_prompt,
                        "judge_prompt": judge_prompt,
                        "opponent_prompt": opponent_prompt,
                        "session_id": session_id
                    }
                    
                    response = requests.post(n8n_url, json=payload, timeout=120)
                    
                    if response.status_code == 200:
                        result = response.json()
                        output = result.get('output', {})
                        
                        # Determine winner and score
                        winner = output.get('winner', '')
                        score = 8.0 if 'defense' in winner.lower() or 'defendant' in winner.lower() else \
                               5.0 if 'split' in winner.lower() or 'partial' in winner.lower() else \
                               2.0
                        
                        run_result = {
                            'runId': run_id,
                            'variation': variation,
                            'winner': winner,
                            'score': score,
                            'defenseArgument': output.get('defense_argument', ''),
                            'plaintiffArgument': output.get('plaintiff_argument', ''),
                            'judgmentSummary': output.get('judgment_summary', ''),
                            'sessionId': session_id
                        }
                        
                        strategy_runs.append(run_result)
                    else:
                        print(f"n8n webhook error: {response.status_code} - {response.text}")
                        strategy_runs.append({
                            'runId': run_id,
                            'variation': variation,
                            'error': f"API error: {response.status_code}",
                            'score': 0
                        })
                
                except Exception as e:
                    print(f"Error calling n8n webhook: {str(e)}")
                    strategy_runs.append({
                        'runId': run_id,
                        'variation': variation,
                        'error': str(e),
                        'score': 0
                    })
                
                # Small delay between calls to avoid overwhelming the API
                time.sleep(2)
            
            # Calculate average score for this strategy
            valid_scores = [r['score'] for r in strategy_runs if 'score' in r and r['score'] > 0]
            average_score = sum(valid_scores) / len(valid_scores) if valid_scores else 0
            
            simulation_results.append({
                'strategyId': strategy_id,
                'strategyTitle': strategy_title,
                'runs': strategy_runs,
                'averageScore': average_score,
                'winsCount': len([r for r in strategy_runs if r.get('score', 0) >= 7])
            })
        
        return jsonify({
            'success': True,
            'results': simulation_results
        })
        
    except Exception as e:
        print(f"Error running simulations: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/generate-memorandum', methods=['POST'])
def generate_memorandum():
    """Generate strategy memorandum based on best simulation result"""
    try:
        data = request.json
        simulation_results = data.get('simulationResults', [])
        case_facts = data.get('caseFacts', '')
        
        if not simulation_results:
            return jsonify({
                'success': False,
                'error': 'No simulation results provided'
            }), 400
        
        # Find the best performing strategy
        best_strategy = max(simulation_results, key=lambda s: s.get('averageScore', 0))
        
        # Find the best run within that strategy
        best_run = max(best_strategy.get('runs', []), key=lambda r: r.get('score', 0))
        
        # Build prompt for memorandum generation
        prompt = f"""
You are an expert legal strategist. Generate a comprehensive legal strategy memorandum based on the following simulation results.

CASE FACTS:
{case_facts}

BEST PERFORMING STRATEGY:
Strategy: {best_strategy.get('strategyTitle', '')}
Average Score: {best_strategy.get('averageScore', 0):.2f}/10
Defense Wins: {best_strategy.get('winsCount', 0)} out of {len(best_strategy.get('runs', []))} simulations

BEST SIMULATION RESULT:
Variation: {best_run.get('variation', '')}
Score: {best_run.get('score', 0):.2f}/10
Winner: {best_run.get('winner', '')}

DEFENSE ARGUMENT (from best simulation):
{best_run.get('defenseArgument', '')}

JUDGMENT SUMMARY:
{best_run.get('judgmentSummary', '')}

Generate a professional legal strategy memorandum with the following sections:

1. EXECUTIVE SUMMARY (2-3 sentences summarizing the recommended strategy)

2. CASE OVERVIEW (brief overview of the case and key legal issues)

3. RECOMMENDED STRATEGY (detailed explanation of the strategy, incorporating the successful arguments from the simulation)

4. SUPPORTING ARGUMENTS (3-4 key legal arguments with analysis, based on the defense argument that succeeded)

5. ANTICIPATED OPPOSITION (based on the simulation, what arguments will the plaintiff make)

6. RISK ANALYSIS (assess the likelihood of success based on the simulation results)

7. NEXT STEPS (concrete action items for implementing this strategy)

Format the memorandum professionally with clear sections. Use legal terminology appropriately. Base all recommendations on the actual arguments and results from the simulation.
"""
        
        # Call OpenAI to generate the memorandum
        response = client.chat.completions.create(
            model="gpt-4o-2024-08-06",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert legal strategist who writes clear, professional legal memoranda based on case analysis and simulation results."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=3000
        )
        
        memorandum_text = response.choices[0].message.content
        
        return jsonify({
            'success': True,
            'memorandum': memorandum_text,
            'bestStrategy': {
                'title': best_strategy.get('strategyTitle', ''),
                'averageScore': best_strategy.get('averageScore', 0),
                'winsCount': best_strategy.get('winsCount', 0),
                'totalRuns': len(best_strategy.get('runs', []))
            },
            'bestRun': {
                'variation': best_run.get('variation', ''),
                'score': best_run.get('score', 0),
                'defenseArgument': best_run.get('defenseArgument', ''),
                'judgmentSummary': best_run.get('judgmentSummary', '')
            }
        })
        
    except Exception as e:
        print(f"Error generating memorandum: {str(e)}")
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

