from fastapi import APIRouter

router = APIRouter()

@router.get("")
def prevention_guidelines(category: str = "all"):
    return {
        "title": "Nigeria Malaria Prevention Guidelines 2026",
        "version": "2026",
        "category": category,
        "guidelines": [
            {
                "category": "mosquito_control",
                "title": "Use insecticide-treated mosquito nets",
                "description": "Sleep under insecticide-treated mosquito nets every night."
            },
            {
                "category": "environment",
                "title": "Remove stagnant water",
                "description": "Eliminate stagnant water around homes and communities."
            },
            {
                "category": "protection",
                "title": "Wear protective clothing",
                "description": "Wear long sleeves and trousers during evening and night hours."
            },
            {
                "category": "repellent",
                "title": "Use mosquito repellent",
                "description": "Apply approved mosquito repellents where appropriate."
            },
            {
                "category": "testing",
                "title": "Test early",
                "description": "Seek a Rapid Diagnostic Test (RDT) or microscopy if fever develops."
            }
        ]
    }
