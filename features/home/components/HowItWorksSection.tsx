"use client";

const steps = [
  {
    step: "1",
    title: "Sign Up",
    description: "Create your free account in seconds. No credit card required.",
  },
  {
    step: "2",
    title: "Choose Storage",
    description: "Select Managed Storage or connect your own S3 bucket.",
  },
  {
    step: "3",
    title: "Start Uploading",
    description: "Upload, organize, and share your files with ease.",
  },
];

export const HowItWorksSection = () => {
  return (
    <section className="bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="h1 mb-4 text-dark-100">How It Works</h2>
          <p className="body-1 mx-auto max-w-2xl text-light-100">
            Get started in minutes with our simple setup process
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-12">
          {steps.map((item, index) => (
            <div key={item.step} className="group text-center">
              <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-100 text-3xl font-bold text-white transition-all duration-300 group-hover:scale-110">
                {item.step}
              </div>
              <h3 className="h2 mb-3 text-dark-100">{item.title}</h3>
              <p className="body-1 leading-relaxed text-light-100">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
