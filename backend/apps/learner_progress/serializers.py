from rest_framework import serializers

class VideoProgressSerializer(serializers.Serializer):
    module_id = serializers.IntegerField()
    progress_percent = serializers.FloatField(min_value=0.0, max_value=100.0)

class QuizProgressSerializer(serializers.Serializer):
    module_id = serializers.IntegerField()
    score_percent = serializers.FloatField(min_value=0.0, max_value=100.0)
    passed = serializers.BooleanField(required=False)

class AssignmentProgressSerializer(serializers.Serializer):
    module_id = serializers.IntegerField()
