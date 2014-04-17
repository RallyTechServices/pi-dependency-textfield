pi-dependency-textfield
=======================

App to enable definition of predecessor and successor links for portfolio items.  

To use:  
Create custom text fields for portfolio items to store predecessor and successor links in.  
In the App, specify the predecessor and successor text fields in the App Settings window.  
Select a portfolio item and add\remove predecessors or successors.  Changes will be applied to the object immediately.  

If the app user doesn't have Editor (or higher) permissions on linked objects for a portfolio item, then the changes will not be applied.  

Known Limitations:
If the selected portfolio item has successor or predecessor linkages to other portfolio items that are not visible to the current user, those linkages may be removed from the selected portfolio item.  
If a user removes the linkages from a portfolio item itself outside of the app (in the portfolio item window), the linkage will not be automatically removed from the related item.  

