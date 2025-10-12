"""
Test script for the simulation API
This tests the complete flow: loading characteristics, building prompts, calling n8n
"""

import requests
import json

def test_simulation():
    """Test the simulation endpoint"""
    
    # Test data
    test_strategies = [
        {
            "id": "strategy-1",
            "title": "Self-Defense Justification",
            "advantages": [
                "Clear legal precedent for self-defense claims",
                "Shifts burden to prosecution to disprove self-defense",
                "Can reduce or eliminate liability if proven"
            ],
            "considerations": [
                "Requires evidence of imminent threat",
                "Proportionality of response is key"
            ]
        }
    ]
    
    test_case_facts = """
    The defendant threw a glass bottle at the plaintiff during a heated argument. 
    The plaintiff claims $1,000,000 in damages for physical injuries and emotional trauma.
    The defendant claims they acted in self-defense after the plaintiff made threatening gestures.
    Witnesses present gave conflicting accounts of who initiated the confrontation.
    """
    
    payload = {
        "strategies": test_strategies,
        "caseFacts": test_case_facts,
        "extractedText": "Additional case documents indicate previous history of disputes between parties.",
        "judgeName": "Hon. Sarah Mitchell",
        "stateAttorneyName": "James Anderson"
    }
    
    print("=" * 80)
    print("TESTING SIMULATION API")
    print("=" * 80)
    print(f"\nTesting with {len(test_strategies)} strategy(ies)")
    print(f"Each strategy will run 3 simulations (Standard, Aggressive, Conservative)")
    print(f"Total expected simulations: {len(test_strategies) * 3}")
    print("\nSending request to http://localhost:5000/api/run-simulations")
    print("This may take 1-2 minutes as each simulation calls the n8n webhook...")
    print("=" * 80)
    
    try:
        response = requests.post(
            'http://localhost:5000/api/run-simulations',
            json=payload,
            timeout=300  # 5 minute timeout
        )
        
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            
            if result.get('success'):
                print("\n✅ SIMULATION SUCCESSFUL!\n")
                
                for strategy_result in result['results']:
                    print(f"\n{'=' * 80}")
                    print(f"STRATEGY: {strategy_result['strategyTitle']}")
                    print(f"Average Score: {strategy_result['averageScore']:.2f}/10")
                    print(f"Defense Wins: {strategy_result['winsCount']}/3")
                    print(f"{'=' * 80}\n")
                    
                    for run in strategy_result['runs']:
                        print(f"\n  Run: {run['variation']}")
                        print(f"  Score: {run.get('score', 0):.2f}/10")
                        print(f"  Winner: {run.get('winner', 'Unknown')}")
                        
                        if 'error' in run:
                            print(f"  ❌ Error: {run['error']}")
                        else:
                            print(f"\n  Defense Argument:")
                            print(f"  {run.get('defenseArgument', 'N/A')[:200]}...")
                            
                            print(f"\n  Plaintiff Argument:")
                            print(f"  {run.get('plaintiffArgument', 'N/A')[:200]}...")
                            
                            print(f"\n  Judgment Summary:")
                            print(f"  {run.get('judgmentSummary', 'N/A')[:200]}...")
                        
                        print(f"\n  {'-' * 76}")
                
                print(f"\n{'=' * 80}")
                print("SUMMARY")
                print(f"{'=' * 80}")
                
                total_runs = sum(len(s['runs']) for s in result['results'])
                total_wins = sum(s['winsCount'] for s in result['results'])
                overall_avg = sum(s['averageScore'] for s in result['results']) / len(result['results'])
                
                print(f"Total Simulations Run: {total_runs}")
                print(f"Total Defense Wins: {total_wins}")
                print(f"Defense Win Rate: {(total_wins/total_runs)*100:.1f}%")
                print(f"Overall Average Score: {overall_avg:.2f}/10")
                print(f"{'=' * 80}\n")
                
            else:
                print(f"\n❌ SIMULATION FAILED")
                print(f"Error: {result.get('error', 'Unknown error')}")
        else:
            print(f"\n❌ HTTP ERROR")
            print(f"Response: {response.text}")
            
    except requests.exceptions.Timeout:
        print("\n❌ REQUEST TIMEOUT")
        print("The simulation took longer than expected. This might be normal for multiple simulations.")
        
    except Exception as e:
        print(f"\n❌ ERROR")
        print(f"Exception: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    test_simulation()

