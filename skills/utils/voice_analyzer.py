#!/usr/bin/env python3
"""
Shared Brand Voice Analyzer

Used by:
- brand-guidelines/SKILL.md (brand consistency checks)
- seo-content-creation/SKILL.md (voice + SEO analysis)

Detects tone, readability, buzzword usage, and consistency issues.
"""

import re
from collections import Counter


def analyze_voice(text):
    """
    Analyze brand voice characteristics.

    Returns:
    {
        'readability_grade': float (Flesch-Kincaid Grade Level),
        'buzzwords_found': list,
        'sentence_avg_length': int,
        'readability_assessment': str,
        'score': float (0-10)
    }
    """

    # Banned buzzwords for V.Two
    banned_words = [
        'synergy', 'paradigm', 'revolutionary', 'world-class', 'game-changing',
        'innovative', 'cutting-edge', 'paradigm shift', 'disruptive',
        'thought leader', 'best in class', 'next generation'
    ]

    # Calculate metrics
    words = text.split()
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if s.strip()]

    if not words or not sentences:
        return {'error': 'Text too short to analyze'}

    word_count = len(words)
    sentence_count = len(sentences)

    # Count syllables (approximation)
    syllables = sum(count_syllables(word) for word in words)

    # Flesch-Kincaid Grade Level
    fk_grade = (0.39 * word_count / sentence_count) + (11.8 * syllables / word_count) - 15.59
    fk_grade = max(0, fk_grade)  # Don't go below 0

    # Detect banned buzzwords
    text_lower = text.lower()
    buzzwords_found = [bw for bw in banned_words if bw in text_lower]

    # Average sentence length
    avg_sentence_length = word_count // sentence_count

    # Readability assessment
    if fk_grade < 8:
        readability = "Very Easy (Good for public audience)"
    elif fk_grade < 12:
        readability = "Easy (Good for professional audience)"
    elif fk_grade < 14:
        readability = "Moderate (OK for technical audience)"
    elif fk_grade < 16:
        readability = "Hard (Getting academic)"
    else:
        readability = "Very Hard (Too academic/complex)"

    # Calculate overall score (0-10)
    score = 10.0

    # Deduct for buzzwords
    score -= len(buzzwords_found) * 1.5

    # Deduct for hard readability (7-8 is ideal)
    if fk_grade < 6 or fk_grade > 10:
        score -= 2

    # Deduct for very long sentences (> 20 words average)
    if avg_sentence_length > 20:
        score -= 1

    score = max(0, min(10, score))  # Clamp to 0-10

    return {
        'readability_grade': round(fk_grade, 1),
        'readability_assessment': readability,
        'buzzwords_found': buzzwords_found,
        'buzzword_count': len(buzzwords_found),
        'sentence_avg_length': avg_sentence_length,
        'word_count': word_count,
        'score': round(score, 1),
        'approval_status': 'APPROVED' if score >= 8 and len(buzzwords_found) == 0 else 'NEEDS_REVISION'
    }


def count_syllables(word):
    """Approximate syllable count (not perfect, but close enough)."""
    word = word.lower()
    syllable_count = 0
    vowels = 'aeiouy'
    previous_was_vowel = False

    for char in word:
        is_vowel = char in vowels
        if is_vowel and not previous_was_vowel:
            syllable_count += 1
        previous_was_vowel = is_vowel

    # Adjust for silent 'e'
    if word.endswith('e'):
        syllable_count -= 1

    # Words have at least 1 syllable
    if syllable_count == 0:
        syllable_count = 1

    return syllable_count


def format_analysis_toon(analysis, content_id="content", approved_by=None):
    """Format analysis results in TOON format for logging."""

    status = "✅" if analysis['approval_status'] == 'APPROVED' else "⚠️"

    return f"""{status} Voice Analysis: {content_id}
Score: {analysis['score']}/10
Readability: Grade {analysis['readability_grade']} ({analysis['readability_assessment']})
Buzzwords Found: {analysis['buzzword_count']} {analysis['buzzwords_found'] if analysis['buzzwords_found'] else '(none)'}
Sentence Avg Length: {analysis['sentence_avg_length']} words
Status: {analysis['approval_status']}
"""


if __name__ == "__main__":
    # Test
    test_text = "V.Two is a revolutionary solution that synergizes AI implementation."
    result = analyze_voice(test_text)
    print(format_analysis_toon(result, "test-content"))
