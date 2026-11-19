# Downloads ONE model, owner-approved 2026-11-19: sentence-transformers/all-MiniLM-L6-v2 (~90 MB, huggingface.co).
from sentence_transformers import SentenceTransformer
m = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
m.save("models/all-MiniLM-L6-v2")
print("saved")
