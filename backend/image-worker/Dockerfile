FROM public.ecr.aws/lambda/python:3.11
# Fonts for watermark text rendering (optional)
RUN yum install -y fontconfig && yum clean all
# Dependencies
RUN pip install pillow boto3
# App code
COPY handler.py ${LAMBDA_TASK_ROOT}
CMD [ "handler.handler" ]
