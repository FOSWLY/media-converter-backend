export class UnAuthorizedError extends Error {
  constructor(unknownToken = false) {
    super(unknownToken ? "Unknown token type" : "Not authenticated");
  }
}

export class InternalServerError extends Error {
  constructor() {
    super("Internal server error (see logs)");
  }
}

export class VideoFileCouldntFound extends Error {
  constructor() {
    super("The video file couldn't be found");
  }
}

export class UnSupportedMediaType extends Error {
  constructor() {
    super("The media has an unsupported format");
  }
}

export class FailedConvertMedia extends Error {
  constructor() {
    super("Failed to convert media file. Let us know about it");
  }
}
