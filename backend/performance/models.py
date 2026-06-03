from django.db import models


class Performance(models.Model):
    PERFORMANCE_LEVEL_CHOICES = [
        ("excellent", "Excellent"),
        ("good", "Good"),
        ("average", "Average"),
        ("needs_improvement", "Needs Improvement"),
    ]

    student_name = models.CharField(max_length=255)
    sport = models.CharField(max_length=100)
    event_name = models.CharField(max_length=150, blank=True, default="")
    performance_score = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    performance_level = models.CharField(
        max_length=30,
        choices=PERFORMANCE_LEVEL_CHOICES,
        default="average",
    )
    performance_date = models.DateField(null=True, blank=True)
    coach_name = models.CharField(max_length=255, blank=True, default="")
    remarks = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-performance_date", "-id"]

    def __str__(self):
        return f"{self.student_name} - {self.sport}"