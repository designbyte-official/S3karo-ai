"use client";

const features = [
  {
    icon: (
      <svg className="size-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
    title: "Your Keys, Your Control",
    description:
      "S3 credentials are encrypted in your browser with AES-256. We never see or store them. Share access via encrypted links—no exposing AWS keys.",
  },
  {
    icon: (
      <svg className="size-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
        />
      </svg>
    ),
    title: "Your Bucket or Ours",
    description:
      "Connect your own AWS S3 bucket or use our managed storage. Switch anytime. Full control when you want it, zero ops when you don’t.",
  },
  {
    icon: (
      <svg className="size-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
    ),
    title: "Multipart Uploads",
    description:
      "Large files upload reliably with automatic multipart uploads. No more timeouts or failed transfers—just drag, drop, and go.",
  },
  {
    icon: (
      <svg className="size-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    ),
    title: "Smart Filtering & Search",
    description:
      "Find files instantly with advanced filters, sorting, and search across all your storage. No more digging through buckets.",
  },
  {
    icon: (
      <svg className="size-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
    ),
    title: "Built-in File Viewer",
    description:
      "Preview images and documents in the app. Rename, download, share, or delete with one click—no need to leave the dashboard.",
  },
  {
    icon: (
      <svg className="size-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
    ),
    title: "Image Compression",
    description:
      "Optimize images before upload. Resize, compress, and convert formats to save space and bandwidth without leaving the app.",
  },
];

const iconGradients = [
  "from-brand to-brand-100",
  "from-blue to-brand-100/80",
  "from-green to-blue/80",
  "from-orange to-brand-100/80",
  "from-brand to-brand-100",
  "from-pink to-brand-100/80",
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="bg-light-300 px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="h1 mb-4 text-dark-100">S3 Without the Friction</h2>
          <p className="body-1 mx-auto max-w-2xl text-light-100">
            Everything you need to manage and share files—clean UI, strong security, and no lock-in.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group rounded-[20px] bg-white p-8 transition-all duration-300 hover:scale-[1.02]"
            >
              <div
                className={`mb-6 flex size-14 items-center justify-center rounded-xl bg-gradient-to-br transition-transform duration-300 group-hover:scale-110 ${iconGradients[index] ?? "from-brand to-brand-100"}`}
              >
                {feature.icon}
              </div>
              <h3 className="h3 mb-3 text-dark-100">{feature.title}</h3>
              <p className="body-1 leading-relaxed text-light-100">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
