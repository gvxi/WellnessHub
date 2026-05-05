**Outcome** \- Integrate Paymob's pre-built UI (Pixel) in the merchant's checkout.

<Divider />

### Pre-Requisites

*   Integrate the Intention API as described in the documentation for the [Create Payment Intention API.](https://developers.paymob.com/paymob-docs/developers/intention-apis/create-intention)
    
*   Include the following script and stylesheets in your HTML file
    

<CodeBlock attributes='{"isFitToPage":true,"style":{},"lang":"html","label":"HTML"}'>
  <CodeLine><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/paymob-pixel@latest/styles.css"></CodeLine>
  <CodeLine><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/paymob-pixel@latest/main.css"></CodeLine>
  <CodeLine><script src="https://cdn.jsdelivr.net/npm/paymob-pixel@latest/main.js" type="module"></script> </CodeLine>
</CodeBlock>

### Usage

Create a new Pixel instance

<CodeBlock attributes='{"isFitToPage":true,"style":{},"lang":"javascript","label":"JavaScript"}'>
  <CodeLine>new Pixel({   publicKey: 'egy_pk_live_XXXX',
   clientSecret: 'egy_csk_live_XXXX',
   paymentMethods: [ 'card','google-pay','apple-pay'],
   elementId: 'paymob-elements',
   disablePay: false,
   showSaveCard :true,
   forceSaveCard : true,
            beforePaymentComplete: async (paymentMethod) => 
{
       console.log('Before payment start');
       return true
   },   
    afterPaymentComplete: async (response) =>
 {
       console.log('After Bannas payment');
   },   onPaymentCancel: () => {
       console.log('Payment has been canceled');
   },   cardValidationChanged: (isValid) => {
       console.log("Is valid ? ", isValid)
   },   customStyle: {
    Font_Family: 'Gotham',
    Font_Size_Label: '16',
    Font_Size_Input_Fields: '16',
    Font_Size_Payment_Button: '14',
    Font_Weight_Label: 400,
    Font_Weight_Input_Fields: 200,
    Font_Weight_Payment_Button: 600,
    Color_Container: '#FFF',
    Color_Border_Input_Fields: '#D0D5DD',
    Color_Border_Payment_Button: '#A1B8FF',
    Radius_Border: '8',
    Color_Disabled: '#A1B8FF',
    Color_Error: '#CC1142',
    Color_Primary: '#144DFF',
    Color_Input_Fields: '#FFF',
    Text_Color_For_Label: '#000',
    Text_Color_For_Payment_Button: '#FFF',
    Text_Color_For_Input_Fields: '#000',
    Color_For_Text_Placeholder: '#667085',
    Width_of_Container: '100%',
    Vertical_Padding: '40',
    Vertical_Spacing_between_components: '18',
    Container_Padding: '0'
   },});
        
</script></CodeLine>
  <CodeLine>new Pixel({</CodeLine>
  <CodeLine>   publicKey: 'egy_pk_live_XXXX',
   clientSecret: 'egy_csk_live_XXXX',
   paymentMethods: [ 'card','google-pay','apple-pay'],
   elementId: 'paymob-elements',
   disablePay: false,
   showSaveCard :true,
   forceSaveCard : true,
         </CodeLine>
  <CodeLine>   beforePaymentComplete: async (paymentMethod) => 
{
       console.log('Before payment start');
       return true
   },   
 </CodeLine>
  <CodeLine>   afterPaymentComplete: async (response) =>
 {
       console.log('After Bannas payment');
   },</CodeLine>
  <CodeLine>   onPaymentCancel: () => {
       console.log('Payment has been canceled');
   },</CodeLine>
  <CodeLine>   cardValidationChanged: (isValid) => {
       console.log("Is valid ? ", isValid)
   },</CodeLine>
  <CodeLine>   customStyle: {
    Font_Family: 'Gotham',
    Font_Size_Label: '16',
    Font_Size_Input_Fields: '16',
    Font_Size_Payment_Button: '14',
    Font_Weight_Label: 400,
    Font_Weight_Input_Fields: 200,
    Font_Weight_Payment_Button: 600,
    Color_Container: '#FFF',
    Color_Border_Input_Fields: '#D0D5DD',
    Color_Border_Payment_Button: '#A1B8FF',
    Radius_Border: '8',
    Color_Disabled: '#A1B8FF',
    Color_Error: '#CC1142',
    Color_Primary: '#144DFF',
    Color_Input_Fields: '#FFF',
    Text_Color_For_Label: '#000',
    Text_Color_For_Payment_Button: '#FFF',
    Text_Color_For_Input_Fields: '#000',
    Color_For_Text_Placeholder: '#667085',
    Width_of_Container: '100%',
    Vertical_Padding: '40',
    Vertical_Spacing_between_components: '18',
    Container_Padding: '0'
   },</CodeLine>
  <CodeLine>});
        
</script></CodeLine>
</CodeBlock>

<Callout attributes='{"isFitToPage":true,"dataType":"info","style":{"width":"100%","minWidth":"100%"}}'>
  <p><strong class="slate-bold">Note</strong>: If Google Pay is passed as a Payment Method, you must include the Google Pay SDK</p>
  <p><script src="https://pay.google.com/gp/p/js/pay.js"></script></p>
</Callout>
<Callout attributes='{"isFitToPage":true,"dataType":"warning","style":{"width":"100%","minWidth":"100%"}}'>
  <p>Google Pay isn't supported in <strong class="slate-bold">Egypt </strong>yet; it's coming soon. Stay tuned.</p>
</Callout>

#### Properties

The full list of properties is as follows:

<Table style="width:100%;min-width:100%" colSizes='["initial","initial"]' isHeaderAdded='true' tableHeader='[{"id":"40e7381c-6702-489c-b3f6-879dfaf370b5","title":"Property name"},{"id":"53c0e982-b856-4cd9-b1c8-97cc924386c5","title":"Type"},{"id":"38f27c68-3fbe-4491-b3a0-80796c8fde5b","title":"Definition"}]'>
  <table-row>
    <table-cell><p class="slate-p ">publicKey</p></table-cell>
    <table-cell><p class="slate-p ">String</p></table-cell>
    <table-cell><p class="slate-p ">To know how to get your public key, please check the <a href="https://developers.paymob.com/paymob-docs/need-help/faq/getting-integration-credentials" target=""><strong class="slate-bold">Getting Integration Credentials</strong></a> page.</p></table-cell>
  </table-row>
  <table-row>
    <table-cell><p class="slate-p ">clientSecret</p></table-cell>
    <table-cell><p class="slate-p ">String</p></table-cell>
    <table-cell><p class="slate-p ">Once you fire the Intention API, you will receive “<strong class="slate-bold">client_secret</strong>” in the API Response, which will be used in the Pixel SDK. Client Secret is unique for each Order, and it expires in an hour.</p></table-cell>
  </table-row>
  <table-row>
    <table-cell><p class="slate-p ">paymentMethods</p></table-cell>
    <table-cell><p class="slate-p ">Array of String</p></table-cell>
    <table-cell><p class="slate-p ">Pass “card” for Card Payments, "google-pay" for Google Pay, and “apple-pay” for Apple Pay.</p></table-cell>
  </table-row>
  <table-row>
    <table-cell><p class="slate-p ">elementId</p></table-cell>
    <table-cell><p class="slate-p ">String</p></table-cell>
    <table-cell><p class="slate-p ">ID of the HTML element where the checkout pixel will be embedded.</p></table-cell>
  </table-row>
  <table-row>
    <table-cell><p class="slate-p ">disablePay</p></table-cell>
    <table-cell><p class="slate-p ">Boolean</p></table-cell>
    <table-cell><p class="slate-p ">Pass true. If you don’t want to use Paymob’s Pay Button for Card Payment, in this case, you will dispatchEvent with the name (payFromOutside) to fire the pay.</p></table-cell>
  </table-row>
  <table-row>
    <table-cell><p class="slate-p ">showSaveCard</p></table-cell>
    <table-cell><p class="slate-p ">Boolean</p></table-cell>
    <table-cell><p class="slate-p ">If this option is set to TRUE, users will have the option to save their card details for future payment.</p></table-cell>
  </table-row>
  <table-row>
    <table-cell><p class="slate-p ">forceSaveCard</p></table-cell>
    <table-cell><p class="slate-p ">Boolean</p></table-cell>
    <table-cell><p class="slate-p ">If this option is set to true, the user's card details will be saved automatically without requiring their consent</p></table-cell>
  </table-row>
  <table-row>
    <table-cell><p class="slate-p ">afterPaymentComplete</p></table-cell>
    <table-cell><p class="slate-p ">Function</p></table-cell>
    <table-cell><p class="slate-p ">This Functionality will be processed after payment is processed by Paymob. Check the full example below.</p></table-cell>
  </table-row>
  <table-row>
    <table-cell><p class="slate-p ">customStyle</p></table-cell>
    <table-cell><p class="slate-p ">Object</p></table-cell>
    <table-cell><p class="slate-p ">You can pass custom styles; for more details, check the full example below.</p></table-cell>
  </table-row>
</Table>

#### Events

We have one event that will be used if you want to trigger the payment from a custom Pay button, not Pixel's Pay button:

<Table style="width:100%;min-width:100%" colSizes='["initial","initial"]' isHeaderAdded='true' tableHeader='[{"id":"48269da6-4b97-4d2b-b75d-a6619e6ca7e2","title":"Title"},{"id":"f25b0c7c-1f78-466e-a20f-fc12bc69595a","title":"Description"}]'>
  <table-row>
    <table-cell><p class="slate-p ">Event</p></table-cell>
    <table-cell><p class="slate-p ">Definition</p></table-cell>
  </table-row>
  <table-row>
    <table-cell><p class="slate-p ">payFromOutside</p></table-cell>
    <table-cell><p class="slate-p ">In case you need to use you pay button instead of the SDK pay button.</p></table-cell>
  </table-row>
</Table>

<CodeBlock attributes='{"isFitToPage":true,"style":{},"lang":"html","label":"HTML"}'>
  <CodeLine><button id="payFromOutsideButton">Pay From Outside Button</button> </CodeLine>
</CodeBlock>
<CodeBlock attributes='{"isFitToPage":true,"style":{},"lang":"javascript","label":"JavaScript"}'>
  <CodeLine>const button = document.getElementById('payFromOutsideButton');
      button?.addEventListener
	  ('click', function () 
	  {
        // Calling pay request
        const event = new Event('payFromOutside');
        window.dispatchEvent(event);
      });</CodeLine>
  <CodeLine>const button = document.getElementById('payFromOutsideButton');
      button?.addEventListener
	  ('click', function () 
	  {
        // Calling pay request
        const event = new Event('payFromOutside');
        window.dispatchEvent(event);
      });</CodeLine>
</CodeBlock>

#### Functions

The full list of functions is as follows:

<Table style="width:100%;min-width:100%" colSizes='["initial","initial"]' isHeaderAdded='true' tableHeader='[{"id":"b411e714-39a3-4fbd-a941-a89311076d90","title":"Function"},{"id":"37b087ef-d127-4962-ae1f-4c782bd54476","title":"Definition"},{"id":"3402d698-56a9-49bf-9cbe-49f5a9004118","title":"What should you do with?"}]'>
  <table-row>
    <table-cell><p class="slate-p ">cardValidationChanged</p></table-cell>
    <table-cell><p class="slate-p ">This Functionality will be processed whenever the card validation status changes.</p></table-cell>
    <table-cell><p class="slate-p ">Writes the function logic</p></table-cell>
  </table-row>
  <table-row>
    <table-cell><p class="slate-p ">beforePaymentComplete</p></table-cell>
    <table-cell><p class="slate-p ">Merchants can implement their own custom logic or functions before the payment is processed by Paymob. Check the full example below.</p></table-cell>
    <table-cell><p class="slate-p ">Writes the function logic</p></table-cell>
  </table-row>
  <table-row>
    <table-cell><p class="slate-p ">afterPaymentComplete</p></table-cell>
    <table-cell><p class="slate-p ">This Functionality will be processed after payment is processed by Paymob. Check the full example below.</p></table-cell>
    <table-cell><p class="slate-p ">Writes the function logic</p></table-cell>
  </table-row>
  <table-row>
    <table-cell><p class="slate-p ">onPaymentCancel</p></table-cell>
    <table-cell><p class="slate-p ">This function applies exclusively to Apple Pay. Merchants can implement their own custom logic to handle scenarios where a user cancels the Apple Pay payment by closing the Apple Pay SDK.</p></table-cell>
    <table-cell><p class="slate-p ">Writes the function logic</p></table-cell>
  </table-row>
  <table-row>
    <table-cell><p class="slate-p ">updateIntentionData</p></table-cell>
    <table-cell><p class="slate-p ">Update the intention data within the SDK if any changes occur to the intention. For more details, refer to<strong class="slate-bold"> </strong><a href="https://developers.paymob.com/paymob-docs/developers/intention-apis/create-intention" target=""><strong class="slate-bold">the Intention Update API documentation</strong></a>.</p></table-cell>
    <table-cell><p class="slate-p ">Calls the function</p></table-cell>
  </table-row>
</Table>

### Full sample

<CodeBlock attributes='{"isFitToPage":true,"style":{},"lang":"html","label":"HTML"}'>
  <CodeLine><!DOCTYPE html></CodeLine>
  <CodeLine><html lang="en"></CodeLine>
  <CodeLine><head></CodeLine>
  <CodeLine>  <meta charset="utf-8"></CodeLine>
  <CodeLine>  <title>Pixel Experience</title></CodeLine>
  <CodeLine>  <base href="/"></CodeLine>
  <CodeLine>  <meta name="viewport" content="width=device-width, initial-scale=1"></CodeLine>
  <CodeLine>  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/paymob-pixel@latest/styles.css"></CodeLine>
  <CodeLine>  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/paymob-pixel@latest/main.css"></CodeLine>
  <CodeLine>  <style></CodeLine>
  <CodeLine>    .content {</CodeLine>
  <CodeLine>      display: flex;</CodeLine>
  <CodeLine>      flex-direction: column;</CodeLine>
  <CodeLine>      gap: 1rem;</CodeLine>
  <CodeLine>      justify-content: center;</CodeLine>
  <CodeLine>      align-items: center;</CodeLine>
  <CodeLine>      margin-top: 2rem;</CodeLine>
  <CodeLine>    }</CodeLine>
  <CodeLine>    #paymob-elements {</CodeLine>
  <CodeLine>      width: 50%;</CodeLine>
  <CodeLine>    }</CodeLine>
  <CodeLine>    #payFromOutsideButton {</CodeLine>
  <CodeLine>      padding: 0.5rem;</CodeLine>
  <CodeLine>      background-color: blue;</CodeLine>
  <CodeLine>      color: white;</CodeLine>
  <CodeLine>      border-radius: 0.2rem;</CodeLine>
  <CodeLine>    }</CodeLine>
  <CodeLine>  </style></CodeLine>
  <CodeLine></head></CodeLine>
  <CodeLine><body></CodeLine>
  <CodeLine>  <div class="header" style="padding: 1rem; background-color: rgb(233, 255, 207);"></CodeLine>
  <CodeLine>    Hello in my website</CodeLine>
  <CodeLine>  </div></CodeLine>
  <CodeLine>  <div class="wrapper"></CodeLine>
  <CodeLine>    <div class="content"></CodeLine>
  <CodeLine>      <div id="paymob-elements"></div></CodeLine>
  <CodeLine>      <button id="payFromOutsideButton">Pay From Outside Button</button></CodeLine>
  <CodeLine>    </div></CodeLine>
  <CodeLine>  </div></CodeLine>
  <CodeLine>  <div class="footer"></div></CodeLine>
  <CodeLine>  <script src="https://cdn.jsdelivr.net/npm/paymob-pixel@latest/main.js" type="module"></script></CodeLine>
  <CodeLine>  <script></CodeLine>
  <CodeLine>    // Configuration</CodeLine>
  <CodeLine>    const BASE_URL= {</CodeLine>
  <CodeLine>      "EGY": "https://accept.paymob.com/",</CodeLine>
  <CodeLine>      "OMN": "https://oman.paymob.com/",</CodeLine>
  <CodeLine>      "KSA": "https://ksa.paymob.com/",</CodeLine>
  <CodeLine>      "UAE": "https://uae.paymob.com/"</CodeLine>
  <CodeLine>    }</CodeLine>
  <CodeLine>    const CONFIG = {</CodeLine>
  <CodeLine>      PUBLIC_KEY: 'egy_pk_test_yVnwxxxxxxxxxxxxxxxxxxxxxxx',</CodeLine>
  <CodeLine>      SECRET_KEY: 'egy_sk_test_3f1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',</CodeLine>
  <CodeLine>      CLIENT_SECRET: 'egy_csk_test_cad1xxxxxxxxxxxxxxxxxxxxx',</CodeLine>
  <CodeLine>      INTENTION_API_URL: BASE_URL.EGY + 'v1/intention/'</CodeLine>
  <CodeLine>    };</CodeLine>
  <CodeLine>    console.log(CONFIG.INTENTION_API_URL)</CodeLine>
  <CodeLine>    // Merchant button logic</CodeLine>
  <CodeLine>    const button = document.getElementById('payFromOutsideButton');</CodeLine>
  <CodeLine>    button?.addEventListener('click', async function() {</CodeLine>
  <CodeLine>      console.log('Updating payment intention...');</CodeLine>
  <CodeLine>      const myHeaders = new Headers();</CodeLine>
  <CodeLine>      myHeaders.append("Authorization", `Token ${CONFIG.SECRET_KEY}`);</CodeLine>
  <CodeLine>      myHeaders.append("Content-Type", "application/json");</CodeLine>
  <CodeLine>      const raw = JSON.stringify({</CodeLine>
  <CodeLine>        "accept_order_id": 446579232,</CodeLine>
  <CodeLine>        "amount": 3000,</CodeLine>
  <CodeLine>        "items": [</CodeLine>
  <CodeLine>          {</CodeLine>
  <CodeLine>            "name": "Item name",</CodeLine>
  <CodeLine>            "amount": 2000,</CodeLine>
  <CodeLine>            "description": "Item description",</CodeLine>
  <CodeLine>            "quantity": 1</CodeLine>
  <CodeLine>          },</CodeLine>
  <CodeLine>          {</CodeLine>
  <CodeLine>            "name": "Item name",</CodeLine>
  <CodeLine>            "amount": 1000,</CodeLine>
  <CodeLine>            "description": "Item description",</CodeLine>
  <CodeLine>            "quantity": 1</CodeLine>
  <CodeLine>          }</CodeLine>
  <CodeLine>        ],</CodeLine>
  <CodeLine>        "billing_data": {</CodeLine>
  <CodeLine>          "apartment": "dumy",</CodeLine>
  <CodeLine>          "first_name": "test",</CodeLine>
  <CodeLine>          "last_name": "update",</CodeLine>
  <CodeLine>          "street": "dumy",</CodeLine>
  <CodeLine>          "building": "dumy",</CodeLine>
  <CodeLine>          "phone_number": "01010101010",</CodeLine>
  <CodeLine>          "city": "dumy",</CodeLine>
  <CodeLine>          "country": "dumy",</CodeLine>
  <CodeLine>          "email": "test@email.com",</CodeLine>
  <CodeLine>          "floor": "dumy",</CodeLine>
  <CodeLine>          "state": "dumy"</CodeLine>
  <CodeLine>        },</CodeLine>
  <CodeLine>        "extras": {</CodeLine>
  <CodeLine>          "ee": 22</CodeLine>
  <CodeLine>        },</CodeLine>
  <CodeLine>        "notification_url": "https://webhook.site/e4081416-3343-4c06-878b-sds55dfd37",</CodeLine>
  <CodeLine>        "redirection_url": "https://google.com/"</CodeLine>
  <CodeLine>      });</CodeLine>
  <CodeLine>      const requestOptions = {</CodeLine>
  <CodeLine>        method: "PUT",</CodeLine>
  <CodeLine>        headers: myHeaders,</CodeLine>
  <CodeLine>        body: raw,</CodeLine>
  <CodeLine>        redirect: "follow"</CodeLine>
  <CodeLine>      };</CodeLine>
  <CodeLine>      try {</CodeLine>
  <CodeLine>        console.log(CONFIG.CLIENT_SECRET);</CodeLine>
  <CodeLine>        console.log(CONFIG.INTENTION_API_URL+CONFIG.CLIENT_SECRET)</CodeLine>
  <CodeLine>        const response = await fetch(`${CONFIG.INTENTION_API_URL}${CONFIG.CLIENT_SECRET}`, requestOptions);</CodeLine>
  <CodeLine>        console.log(response);</CodeLine>
  <CodeLine>      } catch (error) {</CodeLine>
  <CodeLine>        console.error('Error updating intention:', error);</CodeLine>
  <CodeLine>      }</CodeLine>
  <CodeLine>      console.log('Updating Pixel');</CodeLine>
  <CodeLine>      const update_pixel_response = await Pixel.updateIntentionData();</CodeLine>
  <CodeLine>      console.log('Pixel Updated', update_pixel_response);</CodeLine>
  <CodeLine>      // Calling pay request</CodeLine>
  <CodeLine>      const event = new Event('payFromOutside');</CodeLine>
  <CodeLine>      window.dispatchEvent(event);</CodeLine>
  <CodeLine>    });</CodeLine>
  <CodeLine>    onload = (event) => {</CodeLine>
  <CodeLine>      button.style = "display: none;"</CodeLine>
  <CodeLine>      let pixel_instance = new Pixel({</CodeLine>
  <CodeLine>        publicKey: CONFIG.PUBLIC_KEY,</CodeLine>
  <CodeLine>        clientSecret: CONFIG.CLIENT_SECRET,</CodeLine>
  <CodeLine>        paymentMethods: ['card', 'google-pay', 'apple-pay'],</CodeLine>
  <CodeLine>        elementId: 'paymob-elements',</CodeLine>
  <CodeLine>        disablePay: true,</CodeLine>
  <CodeLine>        showSaveCard: false,</CodeLine>
  <CodeLine>        forceSaveCard: true,</CodeLine>
  <CodeLine>        beforePaymentComplete: async () => {</CodeLine>
  <CodeLine>          console.log('Before payment start');          </CodeLine>
  <CodeLine>          console.log('Waiting for 5 seconds...');</CodeLine>
  <CodeLine>          await new Promise(res => setTimeout(() => res(''), 5000));</CodeLine>
  <CodeLine>          console.log('Before payment end');</CodeLine>
  <CodeLine>        },</CodeLine>
  <CodeLine>        afterPaymentComplete: async (response) => {</CodeLine>
  <CodeLine>          console.log('After payment logic');</CodeLine>
  <CodeLine>          console.log(response);</CodeLine>
  <CodeLine>          await new Promise(res => setTimeout(() => res(''), 5000));</CodeLine>
  <CodeLine>        },</CodeLine>
  <CodeLine>        onPaymentCancel: () => {</CodeLine>
  <CodeLine>          console.log('Payment has been canceled');</CodeLine>
  <CodeLine>        },</CodeLine>
  <CodeLine>        cardValidationChanged: (isValid) => {</CodeLine>
  <CodeLine>          if (isValid === true) {</CodeLine>
  <CodeLine>            button.style = "display: block;"</CodeLine>
  <CodeLine>            console.log("valid");</CodeLine>
  <CodeLine>          } else {</CodeLine>
  <CodeLine>            button.style = "display: none;"</CodeLine>
  <CodeLine>            console.log("not valid");</CodeLine>
  <CodeLine>          }</CodeLine>
  <CodeLine>        },</CodeLine>
  <CodeLine>        customStyle: {</CodeLine>
  <CodeLine>          Font_Family: 'Gotham',</CodeLine>
  <CodeLine>          Font_Size_Label: '16',</CodeLine>
  <CodeLine>          Font_Size_Input_Fields: '16',</CodeLine>
  <CodeLine>          Font_Size_Payment_Button: '14',</CodeLine>
  <CodeLine>          Font_Weight_Label: 400,</CodeLine>
  <CodeLine>          Font_Weight_Input_Fields: 200,</CodeLine>
  <CodeLine>          Font_Weight_Payment_Button: 600,</CodeLine>
  <CodeLine>          Color_Container: '#FFF',</CodeLine>
  <CodeLine>          Color_Border_Input_Fields: '#D0D5DD',</CodeLine>
  <CodeLine>          Color_Border_Payment_Button: '#A1B8FF',</CodeLine>
  <CodeLine>          Radius_Border: '8',</CodeLine>
  <CodeLine>          Color_Disabled: '#A1B8FF',</CodeLine>
  <CodeLine>          Color_Error: '#CC1142',</CodeLine>
  <CodeLine>          Color_Primary: '#144DFF',</CodeLine>
  <CodeLine>          Color_Input_Fields: '#FFF',</CodeLine>
  <CodeLine>          Text_Color_For_Label: '#000',</CodeLine>
  <CodeLine>          Text_Color_For_Payment_Button: '#FFF',</CodeLine>
  <CodeLine>          Text_Color_For_Input_Fields: '#000',</CodeLine>
  <CodeLine>          Color_For_Text_Placeholder: '#667085',</CodeLine>
  <CodeLine>          Width_of_Container: '100%',</CodeLine>
  <CodeLine>          Vertical_Padding: '40',</CodeLine>
  <CodeLine>          Vertical_Spacing_between_components: '18',</CodeLine>
  <CodeLine>          Container_Padding: '0'</CodeLine>
  <CodeLine>        }</CodeLine>
  <CodeLine>      });</CodeLine>
  <CodeLine>    };</CodeLine>
  <CodeLine>  </script></CodeLine>
  <CodeLine></body></CodeLine>
  <CodeLine></html> </CodeLine>
</CodeBlock>
<Callout attributes='{"isFitToPage":true,"dataType":"error","style":{"width":"100%","minWidth":"100%"}}'>
  <p>Never put the Secret Key in frontend code. Backend creates/updates intentions; frontend only receives public key and client secret.</p>
  <p>The above sample is for testing only.</p>
</Callout>

### Test Credentials

<Callout attributes='{"isFitToPage":true,"dataType":"info","style":{"width":"100%","minWidth":"100%"}}'>
  <p>To test the payment cycle, you need to use test credentials for Card and Wallet. Please check the <a href="https://developers.paymob.com/paymob-docs/need-help/faq/test-credentials" target=""><strong class="slate-bold">Test Credentials</strong></a> page.</p>
</Callout>