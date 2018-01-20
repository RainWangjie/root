var mixer, bones, skeletonHelper, mid, boneContainer, loaded = false, scale = 0.5;

var matrixWorldInv = new THREE.Matrix4();
var pm = new THREE.Matrix4();
var rm0 = new THREE.Matrix4().makeRotationZ( Math.PI );
var rm1 = new THREE.Matrix4().makeRotationZ( Math.PI*0.5 );
var rm2 = new THREE.Matrix4().makeRotationZ( -Math.PI*0.5 );
var rm3 = new THREE.Matrix4().makeRotationZ( Math.PI*0.03 );
var rm4 = new THREE.Matrix4().makeRotationZ( -Math.PI*0.03 );
var m = new THREE.Matrix4();
var p = new THREE.Vector3();
var s = new THREE.Vector3();
var q = new THREE.Quaternion();

function demo() {

    cam ( [20, 40, 100, [0,20,0]] );

    set({});

    

    view.load_bvh( 'action', initAnimation );

};

function initAnimation ( result ){

    var skeleton = result.skeleton;
    bones = skeleton.bones;

    skeletonHelper = new THREE.SkeletonHelper( bones[ 0 ] );
    skeletonHelper.skeleton = skeleton; // allow animation mixer to bind to SkeletonHelper directly

    skeletonHelper.visible = false;

    boneContainer = new THREE.Group();
    boneContainer.add( bones[ 0 ] );
    boneContainer.scale.multiplyScalar( scale );

    view.addMesh( skeletonHelper );
    view.addMesh( boneContainer );

    initSkeleton();

    // play animation
    mixer = new THREE.AnimationMixer( skeletonHelper );
    mixer.clipAction( result.clip ).setEffectiveWeight( 1.0 ).play();

};

function initSkeleton () {

    mid = [];

    var p1 = new THREE.Vector3();
    var p2 = new THREE.Vector3();
    var i, lng = bones.length, name, bone, child, o, d, w;

    for( i = 0; i<lng; i++ ){

        bone = bones[i];
        name = bone.name;
        if( name==='ENDSITE' ) name = 'ENDSITE'+i

        //if( name!=='ENDSITE' ){

            d = 1;
            p1.copy(bone.getWorldPosition());

            if( i===0 || i===1 || i===2 || i===4 ) w = 4;
            else w = 2;

            if( bone.children.length > 0 ) child = bone.children[0];
            else child = null;

            if( child !== null ){

                p2.copy( child.getWorldPosition() );
                d = Math.distanceVector( p1, p2 ) * scale;

            }

            if( i===4 ) d*=2;

            mid[i] = d * 0.5;

            o = {
                name:name,
                size:[w,d,w],
                pos:p1.toArray(),
                kinematic: true,
                density:0.3, 
                material:'kinematic'
            }

            add( o );

            //console.log(name, i);
        //}

    }

    loaded = true;

    //addHair()
    addExtra();

    // extra loop
    view.update = update;

}

function addHair () {

    var b;
    var spring = [0.1, 0.1];
    var p = bodys[4].position;

    for( i = 0; i < 5; i++){

        b = add({ type:'box', size:[2, 3, 2], pos:[p.x, p.y-(i*4), p.z-3], move:1, density:0.3, restitution:0 });

        if( i===0 ) add({ type:'jointHinge', body1:bodys[4], body2:b.name, pos1:[0,0,-3], pos2:[0,-2,0], axe1:[1,0,0], axe2:[1,0,0], collision:true, spring:spring, min:60, max:90 });
        else add({ type:'jointHinge', body1:b.name-1, body2:b.name, pos1:[0,2,0], pos2:[0,-2,0], axe1:[1,0,0], axe2:[1,0,0], collision:true, spring:spring, min:-10, max:0 });

    }
}

function addExtra () {

    var i = 300, d, w, h, m,  x, z, y;

    w = 50;
    h = 40;
    m = 2;

    add({
        type:[ 'box', 'box', 'box', 'box', 'box' ],
        Rsize:[ [w-(2*m), m, w-(m)], [m,h, w-(2*m)], [m,h, w-(2*m)], [w,h, m], [w,h, m] ],
        Rpos:[ [0,m*0.5, 0], [(w*0.5)-(m*0.5),h*0.5,0], [(-w*0.5)+(m*0.5),h*0.5,0], [0,h*0.5,(w*0.5)-(m*0.5)], [0,h*0.5,(-w*0.5)+(m*0.5)] ],
    });
    
    while( i-- ) {

        w = Math.rand(3,6);
        h = Math.rand(3,6);
        d = Math.rand(3,6);
        x = Math.rand(-10,10);
        z = Math.rand(-10,10);
        y = Math.rand(60,100)

        //add( { type:'box', size:[w,h,d], pos:[x,y,z], move:true } );
        add( { type:'sphere', size:[w*0.5], pos:[x,y,z], density:0.3,  } );

    }

    //var ground = add({size:[50, 10, 50], pos:[0,-5,0] });
}

function updateSkeleton () {

    var bodys = view.getBody();

    matrixWorldInv.getInverse( boneContainer.matrixWorld ); 

    var i = bones.length, bone, body, name;
    while(i--){

        bone = bones[i];
        //body = bodys[i];
        name = bone.name;

        if( name==='ENDSITE' ) name = 'ENDSITE'+i
        
        m.identity().multiplyMatrices( bone.matrixWorld, matrixWorldInv );

        // adjust rotation
        if(i===0 || i===1 || i===2 || i===3 || i===4 ) m.multiply( rm0 );
        if(i===6 || i===8 || i===7 || i===9 ) m.multiply( rm1 );
        if(i===11 ||i===13 || i===12 || i===14 ) m.multiply( rm2 );
        if(i===20 ) m.multiply( rm3 );
        if(i===16 ) m.multiply( rm4 );

        // adjuste position
        pm.identity().makeTranslation( 0, -mid[i], 0 );
        m.multiply( pm );

        m.decompose( p, q, s );

        // apply to physics body
        oimo.send( 'matrix', [ name, p.toArray(), q.toArray() ] );

    }

}

function update () {

    if ( mixer ) mixer.update( 0.003 );
    if ( loaded ) updateSkeleton();

}