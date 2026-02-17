from rest_framework import serializers
from .models import Assignment

class AssignmentSerializer(serializers.ModelSerializer):
    module_title = serializers.ReadOnlyField(source='module.title')
    module_week = serializers.ReadOnlyField(source='module.week')
    assigned_by_name = serializers.ReadOnlyField(source='assigned_by.username')

    class Meta:
        model = Assignment
        fields = ['id', 'user', 'module', 'module_title', 'module_week', 'assigned_by', 'assigned_by_name', 'status', 'due_date', 'assigned_at', 'completed_at']
        read_only_fields = ['assigned_at', 'completed_at', 'assigned_by']
