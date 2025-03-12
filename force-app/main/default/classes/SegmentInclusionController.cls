public with sharing class SegmentInclusionController {
    @AuraEnabled
    public static String createSegmentInclusion(String offerId, String dataspaceName, String segmentId, String segmentName) {
        String segment15Id = segmentId.substring(0, segmentId.length() - 3);
        try {
            Segment_Inclusion__c existingSegmentInclusions = [
                SELECT Id, Segment_ID__c, Segment_Name__c 
                FROM Segment_Inclusion__c 
                WHERE Segment_ID__c = :segment15Id
                LIMIT 1
            ];
            if ( existingSegmentInclusions.Id != null ) {
                return('FAIL: Segment inclusion record already exist');
            }
        } catch(QueryException e)  {
            // it is ok because there is no record previously saved 
        }

        try {
            Segment_Exclusion__c existingSegmentExclusions = [
                SELECT Id, Segment_ID__c, Segment_Name__c 
                FROM Segment_Exclusion__c 
                WHERE Segment_ID__c = :segment15Id
                LIMIT 1
            ];
            if ( existingSegmentExclusions.Id != null ) {
                return('FAIL: Segment exclusion record already exist');
            }
        } catch(QueryException e)  {
            // it is ok because there is no record previously saved
        }

        try {
            // Create a new SegmentInclusion record
            Segment_Inclusion__c newSegmentInclusion = new Segment_Inclusion__c(
                Offer__c = offerId,
                Data_Space__c = dataspaceName,
                Segment_ID__c = segment15Id,
                Segment_Name__c = segmentName
            );            
            insert newSegmentInclusion;
            
            // Return success message with the ID of the created record
            return 'SUCCESS: Segment inclusion record created successfully';
        } 
        catch (Exception e) {
            // Return failure message with the error details
            return 'FAIL: ' + e.getMessage();
        } 
    }}