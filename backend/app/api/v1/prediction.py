@@
 @router.get("/history")
 def prediction_history(request: Request):
@@
     return {"total": len(items), "items": items}
 
 
+@router.get("/{prediction_id}")
+def get_prediction(prediction_id: str, request: Request):
+    """Fetch a single prediction record for the authenticated user by prediction id."""
+    user_id = get_user_id_from_request(request)
+    url = f"{REST_URL}/predictions?id=eq.{prediction_id}&user_id=eq.{user_id}"
+    resp = requests.get(url, headers=service_headers)
+    if resp.status_code != 200:
+        raise HTTPException(
+            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
+            detail=resp.text,
+        )
+    rows = resp.json()
+    if not rows:
+        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction not found")
+
+    r = rows[0]
+    # normalize shape similar to /history item
+    item = {
+        "id": r.get("id"),
+        "prediction": r.get("prediction"),
+        "confidence": r.get("confidence"),
+        "probability": r.get("probability") if r.get("probability") is not None else r.get("probability_estimate"),
+        "risk": r.get("risk") or r.get("risk_level"),
+        "recommendation": r.get("recommendation"),
+        "advice": r.get("advice"),
+        "symptoms": r.get("symptoms"),
+        "ai_insights": r.get("ai_insights"),
+        "created_at": r.get("created_at"),
+    }
+    return item
+
@@
 @router.delete("/history/{prediction_id}", status_code=204)
 def delete_prediction(prediction_id: str, request: Request):
