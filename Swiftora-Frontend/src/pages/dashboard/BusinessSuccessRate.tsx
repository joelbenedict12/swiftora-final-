import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const BusinessSuccessRate = () => {
  const renderFeatureCard = (title: string, description: string) => (
    <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
      <h3 className="font-bold text-lg text-gray-800">{title}</h3>
      <p className="text-gray-600 mt-2">{description}</p>
      <a
        href="#"
        className="text-blue-600 font-semibold mt-4 group inline-block"
      >
        Get Started{" "}
        <span className="transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
          &rarr;
        </span>
      </a>
    </div>
  );

  return (
    <div className="space-y-8 bg-gradient-to-br from-gray-50 to-blue-50 p-4 sm:p-6 lg:p-8 rounded-xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-gray-900">
            Business Success Rate
          </h1>
          <p className="text-gray-600 text-lg">
            Metrics and strategies for improving your business outcomes.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Revenue Protection Section */}
        <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-sm hover:shadow-md transition-all ">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">
              Revenue Protection
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <CardDescription className="mt-1 text-gray-600 ">
              Strategies and tools to protect your revenue streams and reduce
              losses.
            </CardDescription>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {renderFeatureCard(
                "Auto secure",
                "Automatically secure your shipments against loss or damage."
              )}
              {renderFeatureCard(
                "RTO score",
                "Get a risk score for each order to predict the likelihood of return."
              )}
              {renderFeatureCard(
                "Fraud Detection",
                "Proactively identify and block fraudulent orders."
              )}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Buyer Experience & Engagement Section */}
        <Card className="bg-white/60 backdrop-blur-sm border border-white/20 shadow-sm hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">
              Enhanced Buyer Experience & Engagement
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <CardDescription className="mt-1 text-gray-600">
              Improve customer satisfaction and loyalty through better
              engagement.
            </CardDescription>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {renderFeatureCard(
                "Notify",
                "Send automated and branded notifications to your customers."
              )}
              {renderFeatureCard(
                "Brand Boost",
                "Customize your tracking page with your own brand elements."
              )}
              {renderFeatureCard(
                "Delivery Boost",
                "Offer premium delivery options to your customers."
              )}
              {renderFeatureCard(
                "Customer Feedback",
                "Collect and analyze feedback from your customers."
              )}
            </div>
          </CardContent>
        </Card>

        {/* Improved cash flow Section */}
        <Card className="bg-white/60 backdrop-blur-sm border border-white/20 shadow-sm hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">
              Improved Cash Flow
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <CardDescription className="mt-1 text-gray-600">
              Optimize your cash flow for better financial stability and growth.
            </CardDescription>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {renderFeatureCard(
                "Early COD Remittance",
                "Get your Cash on Delivery remittances faster."
              )}
              {renderFeatureCard(
                "Instant Refunds",
                "Process customer refunds instantly to improve satisfaction."
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BusinessSuccessRate;
