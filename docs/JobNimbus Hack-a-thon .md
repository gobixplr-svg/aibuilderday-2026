JobNimbus Hack-a-thon  
**The challenge:** Contractors win deals through fast, accurate estimates. Your task is to build an AI pipeline that takes property information and produces an accurate customer-facing estimate — fully automated, end-to-end, in under 24 hours.  
JobNimbus is the \#1 CRM for roofing and contracting (4.8★ across 12,000+ reviews, 13 years in the trade). They're betting that AI can collapse one of the most painful parts of a contractor's quoting workflow from 30+ minutes down to seconds — and they're spending $10K on a weekend to find the engineers who can prove it.

Create AI roles as agents that will quickly generate contract responses on demand  
\-              Sales person – ask questions of the customer through a survey of the exact styles of roof.  This should allow for the customer to add custom features that will be integrated into the estimator.  Allow the AI sales person to be creative.  
o   Identify upsells like solar panels – add customer value – should NOT come across as a sales pitch but should be a natural question for those replacing a roof.  Allow for incremental cost increase for these items (Can we come up with a better name that is customer-focused instead of sales-focused?  
§  Create hooks to existing solar companies for adding solar panels along with roof replacement  
·      Connect to Remi\!?  
§  Termite inspections and replacing fascia  
§  Water rain gutters  
§  Matching windows & doors (config swap?)  
o   Include questions about the home focused on existing solar panels, existing water damage, anything unsual about the roof,  
§  Is a permit required or optional as chosen by the customer? (\*\*)  
o   Should it allow for roof fixes, as opposed to roof replacement?  
\-              Surveyor – use public information about size of home and pictures  
o   Should it allow for a drone to take pictures of the home – it would take longer but provide a better estimate of existing roof damage  
o   Make adjustments to roof design based on roof wear  
\-              Estimator – use data in the JobNimbus database based on size, shingle type  
\-              Quote Report Generator – create branded, customer-presentable proposal.  
o   Need branding from JobNimbus (color palette, JobNimbus tagline, etc)  
o   Integrate with the metric analyzer to include quote portions that resulted in higher conversion rates.  
\-              Quote Validator – check the quote against other quotes in the historical system based on the size to verify that it is accurate and complete  
o   Build in validating rules from JobNimbus to veify the quote is accurate  
o   Quote generator should be automated but may want to include a manual review for anything that is unusual…but this will vastly slow down the process  
\-              Quote Communicator  
o   Email the quote, present online  
\-              Follow-up on quote  
o   Have agent call the customer to answer any questions – use the preferred medium for communicaton.  What is the best time to follow-up, giving customer time to digest but not letting too much time go by before contact is made.  
o   Try different timelines for follow-up to see if they are more effective. Feed results into the metric analyzer.  
\-              Scheduler  
o   When the customer accepts, creating schedule of when the roofing will be done  
o   Follow-up on key tasks  
\-              Metric analyzer  
o   Weekly reporting on conversions from quotes, follow-up.    
o   This feedback look must be built intot he sales loop and the quote generator.  
\-              Lawyer  
o   Validate the quote?  Not sure if this is necessary  
\-              Other items to build into the application  
o   Generate Leads – use idea from Bryson to use DB for homes in the area to determine when the roof was changed last and make cold calls or email offers to those owners to see if they are ready.  Include special sales deals to encourage people and getting estimates within minutes with the new system\!  
   
   
**Field Capture** — Rep on a job site takes photos and voices a quick description; AI generates a structured, customer-ready estimate in under a minute. Comes at the estimate problem from the *site visit* side rather than satellite/aerial imagery — the gap most existing tools miss.  
   
**Estimate Translator** — Generic output layer that takes any structured scope (windows, doors, roofs, anything) and turns it into a branded, customer-presentable proposal in seconds. Pluggable pricing logic, brand-overlay system per contractor.  
   
**Trade-Agnostic Plan Reading** — One AI pipeline reads architectural plans across multiple trades. Demo flow: roofing schedule today, window/door schedule with a config swap, prove the platform thesis instead of building a single-vertical estimator.  
