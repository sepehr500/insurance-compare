module.exports = {
  siteMetadata: {
    title: "Insurance Comparison Visualizer",
    description: `Insurance calculator`,
    author: `sepehr500`,
  },
  plugins: [
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    "gatsby-plugin-postcss",
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `insurance-compare`,
        short_name: `insurance`,
        start_url: `/`,
        background_color: `#03adfc`,
        theme_color: "#03adfc",
        display: `minimal-ui`,
        icon: `src/images/i-cardiology.png`, // This path is relative to the root of the site.
      },
    },
    // this (optional) plugin enables Progressive Web App + Offline functionality
    // To learn more, visit: https://gatsby.dev/offline
    // `gatsby-plugin-offline`,
  ],
}
