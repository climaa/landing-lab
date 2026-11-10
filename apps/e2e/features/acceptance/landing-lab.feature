Feature: Landing lab

  Taskbloom's garden designers page, twice. The before page draws every star as
  its own image, without alternative text, and sends search engines mixed
  signals. The after page draws the same reviews with one rating image each.
  The numbers on both are measured on the page, never typed in.

  Scenario: A rating reads as one image with its score
    When I visit the after page
    Then every rating on the page is one image named like "Rated 4.5 out of 5"

  Scenario: Half stars are drawn
    When I visit the after page
    Then a rating of 4.5 is drawn as four and a half stars

  Scenario: The after page has no images without alternative text
    When I visit the after page
    Then no image on the page lacks alternative text

  Scenario: The after page has no accessibility violations
    When I visit the after page
    Then the page has no accessibility violations

  Scenario: The comparison shows both pages side by side
    When I visit the compare page
    Then I see the before page and the after page side by side

  Scenario: The after page uses far fewer images
    When I visit the compare page
    Then the after page counts fewer than a tenth of the before page's images

  Scenario: The after page is lighter
    When I visit the compare page
    Then the after page has fewer DOM elements than the before page
    And the after page's HTML document is smaller than the before page's

  Scenario: Accessibility is checked on request
    When I visit the compare page
    And I run the accessibility check on both pages
    Then the before page reports accessibility violations
    And the after page reports none

  Scenario: The numbers describe the page they sit on
    When I visit the before page
    Then the image count shown on it equals the images in its document

  Scenario: The after page passes the SEO guard
    When the SEO guard checks the after page
    Then it reports no findings

  Scenario: The before page links to an address that is not canonical
    When the SEO guard checks the before page
    Then it reports that "/garden-designers" is not its own canonical address

  Scenario: The before page declares the same language twice
    When the SEO guard checks the before page
    Then it reports that "en-GB" is declared twice

  Scenario: The before page names an alternate that does not name it back
    When the SEO guard checks the before page
    Then it reports that "/after" does not list the before page as an alternate

  Scenario: The before page's structured data does not parse
    When the SEO guard checks the before page
    Then it reports structured data that does not parse

  Scenario: Alternates point back at each other
    When the SEO guard checks the after page and its Irish alternate
    Then each lists the other as an alternate

  Scenario: Structured data is listed by type
    When the SEO guard checks the after page
    Then it lists "Organization", "Service" and "AggregateRating" as structured data types

  Scenario: A page with findings fails the run
    When the SEO guard checks the before page
    Then the run exits with a failure

  Scenario: The compare page shows each page's SEO result
    When I visit the compare page
    Then the before page shows 4 SEO findings
    And the after page shows no SEO findings

  Scenario: A visit never reaches analytics
    When I visit the after page
    Then no analytics beacon leaves the browser
