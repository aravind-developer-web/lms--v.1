from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Ensures test users (manager, learner1) exist'

    def handle(self, *args, **options):
        # 1. Create Manager
        if not User.objects.filter(email='manager@lms.com').exists():
            User.objects.create_user(
                username='manager@lms.com',
                email='manager@lms.com', 
                password='securepassword123',
                role='manager'
            )
            self.stdout.write(self.style.SUCCESS('Created manager@lms.com'))
        else:
            u = User.objects.get(email='manager@lms.com')
            u.set_password('securepassword123') # Ensure password is known
            u.role = 'manager'
            u.save()
            self.stdout.write(self.style.SUCCESS('Updated manager@lms.com'))

        # 2. Create Learner
        if not User.objects.filter(email='learner1@lms.com').exists():
            User.objects.create_user(
                username='learner1@lms.com',
                email='learner1@lms.com',
                password='securepassword123',
                role='learner'
            )
            self.stdout.write(self.style.SUCCESS('Created learner1@lms.com'))
        else:
            u = User.objects.get(email='learner1@lms.com')
            u.set_password('securepassword123')
            u.role = 'learner'
            u.save()
            self.stdout.write(self.style.SUCCESS('Updated learner1@lms.com'))
