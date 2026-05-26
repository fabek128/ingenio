from app.main import _extract_llm_reply


def test_extract_llm_reply_from_openai_message_content():
    data = {"choices": [{"message": {"content": " OK "}}]}

    assert _extract_llm_reply(data) == "OK"


def test_extract_llm_reply_from_list_content_blocks():
    data = {
        "choices": [
            {
                "message": {
                    "content": [
                        {"type": "text", "text": "Hola"},
                        {"type": "text", "text": " mundo"},
                    ]
                }
            }
        ]
    }

    assert _extract_llm_reply(data) == "Hola mundo"


def test_extract_llm_reply_empty_response_returns_empty_string():
    data = {"choices": [{"message": {"content": ""}, "finish_reason": "length"}]}

    assert _extract_llm_reply(data) == ""
