from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import json
import openai
from shapely.geometry import LineString, Point

# 🔑 Replace with your OpenAI API key
openai.api_key = "ur api key"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# Load places.json
with open("data/places.json") as f:
    places_data = json.load(f)

@app.post("/chat")
async def chat(request: Request):
    data = await request.json()
    user_msg = data["message"]
    context = data.get("context", {})
    route_coords = context.get("route_coords", [])  # List of [lon, lat] along route

    # Select places along the route
    recommended_places = []
    if route_coords:
        route_line = LineString(route_coords)
        for place in places_data:
            point = Point(place["longitude"], place["latitude"])
            # Within ~0.5 degree (~50 km) of the route
            if route_line.distance(point) < 0.5:
                recommended_places.append(place)

    # Sort by rating and pick top 3
    recommended_places = sorted(recommended_places, key=lambda x: x["rating"], reverse=True)[:3]

    # Prepare RAG context
    knowledge = ""
    for place in recommended_places:
        knowledge += f"- {place['name']} ({place['category']}), Rating: {place['rating']}, Hours: {place['opening_hours']}. {place['description']}\n"

    prompt = f"""
    You are a travel assistant for India.
    Use the following information to answer the user's query:

    {knowledge}

    User question: {user_msg}
    Answer concisely with recommendations and tourist attractions.
    """

    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7
    )
    reply = response.choices[0].message.content

    return {"reply": reply, "places": recommended_places}
