from app.services.ocr_service import check_reliability, OcrResult

def test_reliability_empty_text():
    status = check_reliability("", [], True, "gemini")
    assert status == "failed"

def test_reliability_uncertain_words():
    text = "This is a full answer that explains the concept in detail with more than fifteen words."
    status = check_reliability(text, ["concept"], True, "gemini")
    assert status == "review_required"

def test_reliability_illegible_mark():
    text = "The time complexity is [?] because the partition divides into two halves repeatedly."
    status = check_reliability(text, [], True, "gemini")
    assert status == "review_required"

def test_reliability_not_legible():
    text = "This is a long sentence with more than fifteen words to verify how legible boolean works."
    status = check_reliability(text, [], False, "gemini")
    assert status == "review_required"

def test_reliability_short_text():
    text = "Short answer here."
    status = check_reliability(text, [], True, "gemini")
    assert status == "review_required"

def test_reliability_tesseract_always_review_required():
    text = "This is an offline transcription containing enough words to reach the threshold easily."
    status = check_reliability(text, [], True, "tesseract")
    assert status == "review_required"

def test_reliability_reliable_gemini():
    text = "Binary search trees ensure all left descendents are smaller and all right descendents are greater than the current node."
    status = check_reliability(text, [], True, "gemini")
    assert status == "reliable"
