# Cloudfront CDN for user-uploaded objects/assets WITHOUT cloudfront + s3 "hosting"

## Proposed solution

This should produce a nested stack w/ custom resource(s) that:
    - Provides an SSL-encrypted CDN endpoint for objects stored by a user in the "storage" s3 bucket of the app (without creating a new bucket)
    - Enforces authentication at the edge (edge lambda on viewer-request) with a custom lambda

### Open question/constraints
1. Do we also need to use signed URLs? If so, can we do this with the edge lambda (or another edge lambda?)
2. If so, how do we pass that to the CloudFront distribution/to the S3 bucket it's caching
3. How the heck do I parameterize these cloudformation templates to make them flexible/backend-agnostic (e.g. no hard-coding buckets, cognito pools, etc)
4. How do we get the cloudfront distribution to always reference the latest "version" of the function?!
5. Edge lambdas with CloudFront triggers appear to only be supported in US-EAST-1 (but my project is in west-2)
6. Edge lambdas with CloudFront triggers appear to only support Node 12.x

### Breadcrumbs

- https://gist.github.com/jed/56b1f58297d374572bc51c59394c7e7f
- https://github.com/aws-samples/cloudfront-secure-media

### Steps I took to get this far

- create react app & cd into project
- amplify init
- amplify add auth
- amplify add storage
- amplify add function (and provide read-only access to S3 bucket + cognito/auth)
- modify function template to include `edgelambda` service role
    ```
    Principal:
        Service:
            - lambda.amazonaws.com
            - edgelambda.amazonaws.com
    ```
- add custom resource for cloudfront! (I did this by generating a quick template via `amplify add hosting`)
