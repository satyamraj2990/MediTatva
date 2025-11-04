        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <span className="text-sm">Scroll to explore</span>
            <div className="w-6 h-10 border-2 border-current rounded-full flex justify-center p-2">
              <motion.div 
                className="w-1 h-3 bg-current rounded-full"
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-32 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6 premium-gradient-text">
              Powerful Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to find and manage medicines efficiently
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {[
              {
                icon: Search,
                title: "Smart AI Search",
                description: "Find medicines instantly with AI-powered search across all nearby pharmacies with real-time availability.",
                gradient: "from-blue-500 to-cyan-500",
                delay: 0
              },
              {
                icon: MapPin,
                title: "Live Location",
                description: "Interactive map showing nearby pharmacies with distance, ratings, and opening hours in real-time.",
                gradient: "from-purple-500 to-pink-500",
                delay: 0.2
              },
              {
                icon: MessageCircle,
                title: "Direct Chat",
                description: "Chat directly with pharmacies to check availability, reserve medicines, and get instant responses.",
                gradient: "from-green-500 to-teal-500",
                delay: 0.4
              },
              {
                icon: Bot,
                title: "AI Assistant",
                description: "24/7 AI-powered chatbot to help you find medicines, compare prices, and get health advice.",
                gradient: "from-orange-500 to-red-500",
                delay: 0.6
              },
              {
                icon: Shield,
                title: "Verified Pharmacies",
                description: "All pharmacies are verified and licensed. Your health and safety are our top priorities.",
                gradient: "from-indigo-500 to-blue-500",
                delay: 0.8
              },
              {
                icon: Clock,
                title: "24/7 Availability",
                description: "Access the platform anytime, anywhere. Emergency medicine searches available round the clock.",
                gradient: "from-pink-500 to-rose-500",
                delay: 1
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -10, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="premium-feature-card p-8 h-full relative overflow-hidden group">
                  {/* Animated gradient overlay on hover */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                  />
                  
                  {/* Icon with pulse effect */}
                  <motion.div 
                    className={`relative h-20 w-20 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg`}
                    whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <feature.icon className="h-10 w-10 text-white" />
                    <motion.div
                      className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} blur-xl opacity-50`}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>

                  <h3 className="text-2xl font-bold mb-4 text-foreground group-hover:premium-gradient-text transition-all">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-32 relative overflow-hidden">
        {/* Parallax Background */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10"
          style={{ y: y1 }}
        />
        
        <motion.div 
          className="container mx-auto px-4 relative z-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 premium-gradient-text">
              Loved by Thousands
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See what our users have to say about MediTatva
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="premium-glass-card p-12 relative">
                  <Quote className="absolute top-8 left-8 h-12 w-12 text-primary/20" />
                  
                  <div className="flex flex-col items-center text-center">
                    {/* Avatar */}
                    <motion.div 
                      className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-4xl mb-6 shadow-2xl"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      {testimonials[currentTestimonial].image}
                    </motion.div>

                    {/* Stars */}
                    <div className="flex gap-1 mb-6">
                      {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                        </motion.div>
                      ))}
                    </div>

                    {/* Testimonial Text */}
                    <p className="text-xl text-foreground mb-8 leading-relaxed italic">
                      "{testimonials[currentTestimonial].text}"
                    </p>

                    {/* Author */}
                    <div>
                      <p className="font-bold text-lg text-foreground">
                        {testimonials[currentTestimonial].name}
                      </p>
                      <p className="text-muted-foreground">
                        {testimonials[currentTestimonial].role}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </AnimatePresence>

            {/* Testimonial Dots */}
            <div className="flex justify-center gap-3 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`h-3 rounded-full transition-all duration-300 ${
                    index === currentTestimonial 
                      ? "w-12 bg-gradient-to-r from-blue-500 to-cyan-500" 
                      : "w-3 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative">
        <motion.div 
          className="container mx-auto px-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <Card className="premium-cta-card p-12 md:p-16 text-center relative overflow-hidden">
            {/* Animated background gradient */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 10, repeat: Infinity }}
              style={{ backgroundSize: "200% 200%" }}
            />

            <div className="relative z-10">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="inline-block mb-6"
              >
                <Sparkles className="h-16 w-16 text-cyan-400" />
              </motion.div>

              <h2 className="text-4xl md:text-6xl font-bold mb-6 premium-gradient-text">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
                Join thousands of users who trust MediTatva for their medicine needs
              </p>

              <Link to="/login">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button className="premium-cta-button text-xl px-12 py-8 h-auto group">
                    <span className="flex items-center gap-3">
                      Get Started Now
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <ArrowRight className="h-6 w-6" />
                      </motion.div>
                    </span>
                  </Button>
                </motion.div>
              </Link>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 backdrop-blur-xl bg-background/50 border-t border-white/10">
        {/* Floating Icons Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
          <motion.div
            className="absolute top-10 left-10"
            animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
          >
            <Bot className="h-12 w-12 text-cyan-400" />
          </motion.div>
          <motion.div
            className="absolute top-20 right-20"
            animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
          >
            <MapPin className="h-12 w-12 text-purple-400" />
          </motion.div>
          <motion.div
            className="absolute bottom-10 left-1/3"
            animate={{ y: [0, -15, 0], rotate: [0, 15, 0] }}
            transition={{ duration: 7, repeat: Infinity }}
          >
            <MessageCircle className="h-12 w-12 text-pink-400" />
          </motion.div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Pill className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold premium-gradient-text">MediTatva</span>
              </div>
              <p className="text-muted-foreground">
                Your trusted medicine companion, powered by AI.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-lg mb-4 text-foreground">Quick Links</h4>
              <ul className="space-y-2">
                {["About Us", "Features", "Pricing", "Contact"].map((link) => (
                  <li key={link}>
                    <motion.a
                      href="#"
                      className="text-muted-foreground hover:text-foreground transition-colors relative group"
                      whileHover={{ x: 5 }}
                    >
                      {link}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 group-hover:w-full transition-all" />
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>

            {/* For Patients */}
            <div>
              <h4 className="font-bold text-lg mb-4 text-foreground">For Patients</h4>
              <ul className="space-y-2">
                {["Find Medicines", "Track Orders", "Emergency", "Support"].map((link) => (
                  <li key={link}>
                    <motion.a
                      href="#"
                      className="text-muted-foreground hover:text-foreground transition-colors relative group"
                      whileHover={{ x: 5 }}
                    >
                      {link}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 group-hover:w-full transition-all" />
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>

            {/* For Pharmacies */}
            <div>
              <h4 className="font-bold text-lg mb-4 text-foreground">For Pharmacies</h4>
              <ul className="space-y-2">
                {["Register", "Dashboard", "Analytics", "Help Center"].map((link) => (
                  <li key={link}>
                    <motion.a
                      href="#"
                      className="text-muted-foreground hover:text-foreground transition-colors relative group"
                      whileHover={{ x: 5 }}
                    >
                      {link}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-green-500 to-teal-500 group-hover:w-full transition-all" />
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-white/10 pt-8 text-center">
            <p className="text-muted-foreground">
              © {new Date().getFullYear()} MediTatva. All rights reserved. Made with{" "}
              <motion.span
                className="inline-block"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                ❤️
              </motion.span>{" "}
              for better healthcare.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
