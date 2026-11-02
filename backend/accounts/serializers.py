from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from rest_framework import serializers


User = get_user_model()


class CandidateRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={"input_type": "password"},
    )

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]
        read_only_fields = ["id"]

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            role=User.Role.CANDIDATE,
        )
        return user
    
    
class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = "email"

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                {"detail": "Invalid email or password."}
            )

        if not user.check_password(password):
            raise serializers.ValidationError(
                {"detail": "Invalid email or password."}
            )

        if not user.is_active:
            raise serializers.ValidationError(
                {"detail": "This account is inactive."}
            )

        refresh = self.get_token(user)

        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }
from rest_framework import serializers


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "role"]