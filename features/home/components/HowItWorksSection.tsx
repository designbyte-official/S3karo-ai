"use client";

const steps = [
  { step: "1", title: "Sign Up", description: "Create your free account in seconds. No credit card required." },
  { step: "2", title: "Choose Storage", description: "Select Managed Storage or connect your own S3 bucket." },
  { step: "3", title: "Start Uploading", description: "Upload, organize, and share your files with ease." },
];

export const HowItWorksSection = () => {
  return (
    <section className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="h1 text-3xl sm:text-4xl lg:text-5xl text-dark-200 mb-4">
            How It Works
          </h2>
          <p className="body-1 text-lg sm:text-xl text-light-100 max-w-2xl mx-auto">
            Get started in minutes with our simple setup process
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-20 h-20 bg-brand text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-drop-2">
                {item.step}
              </div>
              <h3 className="h2 text-dark-200 mb-3">{item.title}</h3>
              <p className="body-1 text-light-100 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

