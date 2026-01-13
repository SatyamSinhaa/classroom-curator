from app.models import Teacher
import sqlalchemy

print(f"Teacher has user_id: {hasattr(Teacher, 'user_id')}")
print(f"Type of Teacher.user_id: {type(getattr(Teacher, 'user_id', None))}")

# Check if it's an InstrumentedAttribute
from sqlalchemy.orm.attributes import InstrumentedAttribute
print(f"Is InstrumentedAttribute: {isinstance(getattr(Teacher, 'user_id', None), InstrumentedAttribute)}")
