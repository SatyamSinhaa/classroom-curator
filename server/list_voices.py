import asyncio
import edge_tts

async def list_voices():
    voices = await edge_tts.list_voices()
    
    print(f"{'Name':<35} {'Gender':<10} {'Locale':<15}")
    print("-" * 60)
    
    # Filter for English voices primarily, but show others if needed
    english_voices = [v for v in voices if "en-" in v["ShortName"]]
    
    for v in english_voices:
        print(f"{v['ShortName']:<35} {v['Gender']:<10} {v['Locale']:<15}")
        
    print(f"\nTotal English Voices: {len(english_voices)}")
    print(f"Total Voices available: {len(voices)}")

if __name__ == "__main__":
    asyncio.run(list_voices())
