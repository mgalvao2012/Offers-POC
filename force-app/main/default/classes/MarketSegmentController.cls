public with sharing class MarketSegmentController {
    @AuraEnabled(cacheable=true)
    public static List<MarketSegment> searchMarketSegments(String searchTerm, String dataspaceId) {
        String searchKey = '%' + searchTerm + '%';
        return [
            SELECT Id, Name
            FROM MarketSegment
            WHERE DataspaceId = :dataspaceId AND Name LIKE :searchKey 
            WITH SECURITY_ENFORCED
            ORDER BY Name
            LIMIT 10
        ];
    }
}