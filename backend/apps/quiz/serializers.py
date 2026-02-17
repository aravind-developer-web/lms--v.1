from rest_framework import serializers
from .models import Quiz, Question, Answer, QuizAttempt

class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ('id', 'text', 'is_correct')
        extra_kwargs = {'is_correct': {'write_only': True}} # Hide correct answers

class QuestionSerializer(serializers.ModelSerializer):
    answers = AnswerSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ('id', 'text', 'answers', 'order')

class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    module_title = serializers.ReadOnlyField(source='module.title')
    module_week = serializers.ReadOnlyField(source='module.week')

    class Meta:
        model = Quiz
        fields = ('id', 'title', 'passing_score', 'questions', 'module', 'module_title', 'module_week')

class QuizAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAttempt
        fields = '__all__'
