// Cookie Formatter Tool for Kinray Session Injection
// Copy and paste your cookie values here

const cookieData = {
  // Copy the values from your browser's Application tab
  "_abck": "AC756293DF37C328FA11ECF46...", // Replace with your actual value
  "ak_bmsc": "2FFF8DD33F3F2D01141F61A169...", // Replace with your actual value  
  "bm_sv": "9CB90C60F310DBE1F85...", // Replace with your actual value
  "bm_sz": "CAD59210AD8D837813342FF63...", // Replace with your actual value
  "dtCookie": "v_4_srv_11_sn_883C1B98E21522...", // Replace with your actual value
  "dtPC": "11$520019366_310h-vPAXCRQ...", // Replace with your actual value
  "dtSa": "-", // Usually just a dash
  "okta-oauth-nonce": "51GePTswrm", // Replace with your actual value
  "okta-oauth-state": "8rFzrs5MH5g", // Replace with your actual value
  "rxVisitor": "175313748650017531356865500", // Replace with your actual value
  "rxvt": "175313748650017531356865500" // Replace with your actual value
};

// Format as JSON for the cookie injection system
const formattedCookies = Object.entries(cookieData).map(([name, value]) => ({
  name,
  value,
  domain: ".cardinalhealth.com",
  path: "/"
}));

console.log("Formatted cookies for injection:");
console.log(JSON.stringify(formattedCookies, null, 2));