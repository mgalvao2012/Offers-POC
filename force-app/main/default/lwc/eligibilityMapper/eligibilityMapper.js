import { LightningElement, wire, track } from 'lwc';
import { api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import findDataspaces from '@salesforce/apex/DataspaceController.getDataspaces';
import findSegments from '@salesforce/apex/MarketSegmentController.searchMarketSegments';
import createSegmentInclusion from '@salesforce/apex/SegmentInclusionController.createSegmentInclusion';
import createSegmentExclusion from '@salesforce/apex/SegmentExclusionController.createSegmentExclusion';

const DELAY = 300; // Debounce delay in milliseconds

export default class EligibilityMapper extends LightningElement {
    @track searchTerm = '';
    @track segments = [];
    @track selectedSegment = null;
    @track error;
    @track record;
    @api recordId;

    connectedCallback() {
        if (this.recordId) {
            console.log('Record ID:', this.recordId);
        } else {
            console.log('Record ID is not yet available');
        }
    }    
    // Dataspace
    selectedDataspace = '';
    @wire(findDataspaces)
    wiredDataspaces({ error, data }) {
        if (data) {
            try {
                let options = [];
                for (let i = 0; i < data.length; i++) {
                    options.push({
                       label: data[i].Name,
                       value: data[i].Id
                    });
                }
                this.dataspaceOptions = options;
            } catch (error) {
                console.error('Error processing data', error);
            }
        } else if (error) {
            this.error = error;
            console.error('Error retrieving dataspace', error);
        }
    }

    handleDataspaceChange(event) {
        this.selectedDataspace = event.detail.value;
    }

    // Segments    
    delayTimeout; // Debounce timer
    
    get showResults() {
        return this.segments.length > 0;
    }
    
    handleSearchChange(event) {
        const searchKey = event.target.value;
        
        // Clear any pending debounce timer
        clearTimeout(this.delayTimeout);
        
        // If search term is empty, clear results
        if (!searchKey) {
            this.segments = [];
            // Clear the selected segment
            this.selectedSegment = null;
            return;
        }
        
        // Debounce the search to avoid too many server calls
        this.delayTimeout = setTimeout(() => {
            this.searchTerm = searchKey;
            this.searchSegments();
        }, DELAY);
    }
    
    searchSegments() {
        findSegments({ searchTerm: this.searchTerm, dataspaceId: this.selectedDataspace})
            .then(result => {
                this.segments = result;
                this.error = undefined;
            })
            .catch(error => {
                this.error = error;
                this.segments = [];
            });
    }
    
    handleSegmentSelection(event) {
        const segmentId = event.currentTarget.dataset.id;
        const segmentName = event.currentTarget.dataset.name;
        
        this.selectedSegment = {
            Id: segmentId,
            Name: segmentName
        };
        
        // Dispatch event for parent components if needed
        const selectedEvent = new CustomEvent('segmentselected', {
            detail: this.selectedSegment
        });
        this.dispatchEvent(selectedEvent);
        
        // Clear the search results
        this.segments = [];        
    }

    handleSegmentKeyUp(event) {
        this.segments = [];
    }
    
    // Handle the inclusion and exclusion buttons
    selectedButton = ''; 
    handleButtonIncExcClick(event) {
        // Get the clicked button
        const clickedButton = event.currentTarget;
        
        // Get all buttons in the group
        const allButtons = this.refs.buttonGroup.children;
        
        //Reset all buttons to neutral variant
        for (let btn of allButtons) {
            btn.variant = 'neutral';
        }
        
        // Set the clicked button to brand variant (highlighted)
        clickedButton.variant = 'brand';
        
        // Update the selected button value
        this.selectedButton = clickedButton.dataset.value;
    }

    // Submit the form
    handleButtonApplyClick(event) {               
        let dataspaceName = this.getDataspaceNameSelected();
        if(dataspaceName == '' || this.selectedSegment.Id == '' || this.selectedButton == '') {
            const event = new ShowToastEvent({
                title: 'Warning!',
                message: 'Fill all the fields in the form',
                variant: 'warning',
                mode: 'dismissable'
            });
            this.dispatchEvent(event);
            return;
        }
        if (this.selectedButton === 'inclusion') {        
            createSegmentInclusion({ offerId: this.recordId, dataspaceName: dataspaceName, 
                segmentId: this.selectedSegment.Id, segmentName: this.selectedSegment.Name})
                .then(result => {
                    if(result.includes('SUCCESS:')) {
                        const event = new ShowToastEvent({
                            title: 'Success!',
                            message: result,
                            variant: 'success',
                            mode: 'dismissable'
                        });
                        this.dispatchEvent(event);
                    }
                    if(result.includes('FAIL:')) {
                        const event = new ShowToastEvent({
                            title: 'Error!',
                            message: result,
                            variant: 'error',
                            mode: 'dismissable'
                        });
                        this.dispatchEvent(event);
                    }
                    this.error = undefined;
                })
                .catch(error => {
                    this.error = error;
                    const event = new ShowToastEvent({
                        title: 'Error!',
                        message: error,
                        variant: 'error',
                        mode: 'dismissable'
                    });
                    this.dispatchEvent(event);
                });
        }

        if (this.selectedButton === 'exclusion') {        
            createSegmentExclusion({ offerId: this.recordId, dataspaceName: dataspaceName, 
                segmentId: this.selectedSegment.Id, segmentName: this.selectedSegment.Name})
                .then(result => {
                    if(result.includes('SUCCESS:')) {
                        const event = new ShowToastEvent({
                            title: 'Success!',
                            message: result,
                            variant: 'success',
                            mode: 'dismissable'
                        });
                        this.dispatchEvent(event);
                    }
                    if(result.includes('FAIL:')) {
                        const event = new ShowToastEvent({
                            title: 'Error!',
                            message: result,
                            variant: 'error',
                            mode: 'dismissable'
                        });
                        this.dispatchEvent(event);
                    }
                    this.error = undefined;
                })
                .catch(error => {
                    this.error = error;
                    const event = new ShowToastEvent({
                        title: 'Error!',
                        message: error,
                        variant: 'error',
                        mode: 'dismissable'
                    });
                    this.dispatchEvent(event);
                });
        }


        // restart the form
        this.template.querySelector('form').reset();
    }

    getDataspaceNameSelected() {
        let dataspaceName = '';
        for(let dataspace of this.dataspaceOptions ) {
            if(dataspace.value == this.selectedDataspace) {
                return dataspace.label;
            }
        }
    }

}
