import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

// Data for services
const serviceSections = [
  {
    section: "Value Added Services",
    services: [
      {
        title: "Delivery Protect",
        description:
          "Ensure your shipments are protected against loss, damage, or theft with comprehensive insurance coverage.",
        bannerColor: "bg-gradient-to-r from-blue-500 to-indigo-600",
      },
      {
        title: "Communications",
        description:
          "Stay connected with real-time tracking, notifications, and customer communication tools.",
        bannerColor: "bg-gradient-to-r from-purple-500 to-pink-600",
      },
      {
        title: "Channel Integration",
        description:
          "Seamlessly integrate with multiple sales channels for unified order management and fulfillment.",
        bannerColor: "bg-gradient-to-r from-green-500 to-teal-600",
      },
    ],
  },
  {
    section: "Logistics Services",
    services: [
      {
        title: "Direct Intracity",
        description:
          "Fast and reliable delivery within city limits for same-day or next-day service.",
        bannerColor: "bg-gradient-to-r from-orange-500 to-red-600",
      },
      {
        title: "Domestic Parcel",
        description:
          "Efficient parcel delivery across domestic locations with tracking and insurance options.",
        bannerColor: "bg-gradient-to-r from-cyan-500 to-blue-600",
      },
      {
        title: "Domestic B2B Cargo",
        description:
          "Specialized cargo services for business-to-business shipments within the country.",
        bannerColor: "bg-gradient-to-r from-rose-500 to-pink-600",
      },
      {
        title: "Cross Border Express",
        description:
          "Express international shipping for urgent documents and small packages.",
        bannerColor: "bg-gradient-to-r from-amber-500 to-yellow-600",
      },
      {
        title: "Cross Border LCL",
        description:
          "Less than container load services for international shipments at cost-effective rates.",
        bannerColor: "bg-gradient-to-r from-lime-500 to-green-600",
      },
      {
        title: "Full Truck Load",
        description:
          "Complete truckload services for large shipments and bulk cargo transportation.",
        bannerColor: "bg-gradient-to-r from-indigo-500 to-purple-600",
      },
    ],
  },
];

const ServiceCard = ({
  title,
  description,
  bannerColor,
}: {
  title: string;
  description: string;
  bannerColor: string;
}) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
    <div className={`h-24 ${bannerColor}`} />
    <div className="p-6">
      <h3 className="font-bold text-lg text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm mb-4">{description}</p>
      <Button
        asChild
        className="w-full bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] hover:from-[hsl(210_100%_60%)]/90 hover:to-[hsl(207,97%,45%)]/90 text-white shadow-lg"
      >
        <Link to="#">Active</Link>
      </Button>
    </div>
  </div>
);

const Services = () => {
  return (
    <div className="space-y-12 bg-gray-50 p-4 sm:p-6 lg:p-8 rounded-xl">
      <header className="text-center">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-3">Services</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Discover our comprehensive range of value-added and logistics services
          designed to optimize your supply chain.
        </p>
      </header>

      {serviceSections.map((section) => (
        <section key={section.section}>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            {section.section}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {section.services.map((service) => (
              <ServiceCard key={service.title} {...service} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default Services;
