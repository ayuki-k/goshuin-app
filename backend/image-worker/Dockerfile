FROM python:3.11-slim
RUN pip install pillow boto3
WORKDIR /app
COPY handler.py .
CMD [ "python3", "handler.py", "local" ]