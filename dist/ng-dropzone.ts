import * as angular from 'angular';
import * as Dropzone from 'dropzone';

interface IDsDropzoneProvider {
    getOptions(): object;
}

export class DsDropzoneService implements ng.IServiceProvider {

    protected defOps = {
        /**
         * Update with desired DropzoneJS options to override
         * Dropzone default options at provider level
         */
    }

    constructor() {
        this.$get();
    }

    public setOptions(newOps) {
        angular.extend(this.defOps, newOps);
    }

    public $get() : IDsDropzoneProvider {
        return {
            getOptions: () => this.defOps
        };
    }
}

export class NgDropzoneDirective implements ng.IDirective {
    private $timeout: ng.ITimeoutService;
    private dropzoneOps: DsDropzoneService;

    public restrict: 'AE';
    public replace: true;
    public template = '<div></div>';
    public scope = {
        options: '=?', //http://www.dropzonejs.com/#configuration-options
        callbacks: '=?', //http://www.dropzonejs.com/#events
        methods: '=?' //http://www.dropzonejs.com/#dropzone-methods
    }

    constructor($timeout: ng.ITimeoutService){
        this.$timeout = $timeout;
        this.dropzoneOps = new DsDropzoneService();
    }

    public link: ng.IDirectiveLinkFn = (
        scope: ng.IScope, 
        iElem: ng.IAugmentedJQuery, 
        iAttr: ng.IAttributes
    ) => { 
        //Set options for dropzone {override from dropzone options provider}
        scope.options = scope.options || {};
        var initOps = angular.extend({}, this.dropzoneOps.$get().getOptions(), scope.options);
        
        
        //Instantiate dropzone with initOps
        var dropzone = new Dropzone(iElem[0], initOps);
        // save dropzone instance to accessible global var 
        scope.$root.dz = dropzone;
        
        
        /*********************************************/
        
        
        //Instantiate Dropzone methods (Control actions)
        scope.methods = scope.methods || {};
        
        scope.methods.getDropzone = function(){ 
          return dropzone; //Return dropzone instance
        };
        
        scope.methods.getAllFiles = function(){ 
          return dropzone.files; //Return all files
        };
        
        var controlMethods = [
          'removeFile', 'removeAllFiles', 'processQueue',
          'getAcceptedFiles', 'getRejectedFiles', 'getQueuedFiles', 'getUploadingFiles',
          'disable', 'enable', 'confirm', 'createThumbnailFromUrl'
        ];
        
        angular.forEach(controlMethods, function(methodName){
          scope.methods[methodName] = function(){
            dropzone[methodName].apply(dropzone, arguments);
            if(!scope.$$phase && !scope.$root.$$phase) scope.$apply();
          }
        });
        
        
        /*********************************************/
        
        
        //Set invents (callbacks)
        if(scope.callbacks){
          var callbackMethods = [
            'drop', 'dragstart', 'dragend',
            'dragenter', 'dragover', 'dragleave', 'addedfile', 'removedfile',
            'thumbnail', 'error', 'processing', 'uploadprogress',
            'sending', 'success', 'complete', 'canceled', 'maxfilesreached',
            'maxfilesexceeded', 'processingmultiple', 'sendingmultiple', 'successmultiple',
            'completemultiple', 'canceledmultiple', 'totaluploadprogress', 'reset', 'queuecomplete'
          ];
          angular.forEach(callbackMethods, function(method){
            var callback = (scope.callbacks[method] || angular.noop);
            dropzone.on(method, function(){
              callback.apply(null, arguments);
              if(!scope.$$phase && !scope.$root.$$phase) scope.$apply();
            });
          });
        }
    };

    public static factory() : ng.IDirectiveFactory {
        const directive: ng.IDirectiveFactory = (
            $timeout: ng.ITimeoutService
        ) => new NgDropzoneDirective($timeout);
        directive.$inject = ['$timeout'];
        return directive;
    }
    
}

angular.module('ds.dropzone', [])
    .directive('ngDropzone', NgDropzoneDirective.factory())
    .service('dsDropzoneService', DsDropzoneService);
    