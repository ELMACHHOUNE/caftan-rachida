// Minimal smoke test to ensure category route image mapping works.
// This does NOT hit HTTP; it tests the mapping logic expectations locally.
//
// Run manually if needed:
//   node test-category-image-mapping.js

function mapBodyToCategoryCreate(body) {
  const mapped = { ...body };
  const imageUrlFromBody =
    (typeof mapped.image === "string" && mapped.image.trim()) ||
    (typeof mapped.categoryImage === "string" && mapped.categoryImage.trim());

  if (imageUrlFromBody) {
    mapped.image = {
      url: imageUrlFromBody,
      public_id: null,
      alt: mapped.name,
    };
  }
  return mapped;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

(function run() {
  const a = mapBodyToCategoryCreate({
    name: "Takchita",
    image: "https://x/y.png",
  });
  assert(
    typeof a.image === "object",
    "image should become object when string URL provided"
  );
  assert(
    a.image.url === "https://x/y.png",
    "image.url should equal provided URL"
  );

  const b = mapBodyToCategoryCreate({
    name: "Takchita",
    categoryImage: "https://x/z.png",
  });
  assert(
    b.image.url === "https://x/z.png",
    "categoryImage should map to image.url"
  );

  const c = mapBodyToCategoryCreate({ name: "Takchita" });
  assert(!c.image, "image should remain undefined if not provided");

  console.log("OK: category image mapping smoke test passed");
})();
