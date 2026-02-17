from pydantic import BaseModel, Field, validator
from typing import List

class QuestionItem(BaseModel):
    question: str = Field(..., min_length=5, description="The question text")
    options: List[str] = Field(..., min_items=4, max_items=4, description="List of 4 options")
    correct_option: str = Field(..., pattern="^[A-D]$", description="Correct option index (A, B, C, or D)")

    @validator('options')
    def check_options_not_empty(cls, v):
        if any(not opt.strip() for opt in v):
            raise ValueError("Options cannot be empty strings")
        return v

class AssignmentItem(BaseModel):
    title: str = Field(..., min_length=5)
    description: str = Field(..., min_length=10)

class AIResponseSchema(BaseModel):
    questions: List[QuestionItem] = Field(..., min_items=5, max_items=5)
    assignment: AssignmentItem
