-- VideoReview: seller reply, report flag, updated_at
ALTER TABLE "video_reviews" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE "video_reviews" ADD COLUMN IF NOT EXISTS "seller_reply" TEXT;
ALTER TABLE "video_reviews" ADD COLUMN IF NOT EXISTS "seller_reply_at" TIMESTAMPTZ;
ALTER TABLE "video_reviews" ADD COLUMN IF NOT EXISTS "seller_reply_updated_at" TIMESTAMPTZ;
ALTER TABLE "video_reviews" ADD COLUMN IF NOT EXISTS "is_reported" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "video_reviews" ADD COLUMN IF NOT EXISTS "reported_at" TIMESTAMPTZ;
ALTER TABLE "video_reviews" ADD COLUMN IF NOT EXISTS "reported_by" TEXT;

CREATE INDEX IF NOT EXISTS "video_reviews_video_id_rating_idx" ON "video_reviews"("video_id", "rating");
