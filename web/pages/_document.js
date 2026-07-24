import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link href="/plugins/bootstrap/bootstrap.min.css" rel="stylesheet" />
        <link rel="stylesheet" href="/plugins/themify-icons/themify-icons.css" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
        <link href="/plugins/slick/slick.css" rel="stylesheet" />
        <link href="/plugins/slick/slick-theme.css" rel="stylesheet" />
        <link href="/css/style.css" rel="stylesheet" />
        <link href="images/favicon.png" rel="shortcut icon"/>
      </Head>
      <body class="body-wrapper">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
