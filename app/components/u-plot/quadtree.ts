const MAX_OBJECTS = 10;
const MAX_LEVELS = 4;

interface QuadTreeBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface QuadTreeObject extends QuadTreeBounds {
  sidx: number; // series index
  didx: number; // data index
}

class Quadtree {
  private positionX: number;
  private positionY: number;
  private width: number;
  private height: number;
  private level: number;
  private objects: QuadTreeObject[];
  private quadrants: Quadtree[] | null;

  constructor(x: number, y: number, width: number, height: number, level = 0) {
    this.positionX = x;
    this.positionY = y;
    this.width = width;
    this.height = height;
    this.level = level;
    this.objects = [];
    this.quadrants = null;
  }

  private split(): void {
    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;
    const nextLevel = this.level + 1;

    this.quadrants = [
      // top right
      new Quadtree(
        this.positionX + halfWidth,
        this.positionY,
        halfWidth,
        halfHeight,
        nextLevel,
      ),
      // top left
      new Quadtree(
        this.positionX,
        this.positionY,
        halfWidth,
        halfHeight,
        nextLevel,
      ),
      // bottom left
      new Quadtree(
        this.positionX,
        this.positionY + halfHeight,
        halfWidth,
        halfHeight,
        nextLevel,
      ),
      // bottom right
      new Quadtree(
        this.positionX + halfWidth,
        this.positionY + halfHeight,
        halfWidth,
        halfHeight,
        nextLevel,
      ),
    ];
  }

  private quads(
    x: number,
    y: number,
    width: number,
    height: number,
    callback: (quadrant: Quadtree) => void,
  ): void {
    if (!this.quadrants) return;

    const horizontalMidpoint = this.positionX + this.width / 2;
    const verticalMidpoint = this.positionY + this.height / 2;
    const isStartNorth = y < verticalMidpoint;
    const isStartWest = x < horizontalMidpoint;
    const isEndEast = x + width > horizontalMidpoint;
    const isEndSouth = y + height > verticalMidpoint;

    // top-right quadrant
    if (isStartNorth && isEndEast) callback(this.quadrants[0]);
    // top-left quadrant
    if (isStartWest && isStartNorth) callback(this.quadrants[1]);
    // bottom-left quadrant
    if (isStartWest && isEndSouth) callback(this.quadrants[2]);
    // bottom-right quadrant
    if (isEndEast && isEndSouth) callback(this.quadrants[3]);
  }

  add(object: QuadTreeObject): void {
    if (this.quadrants) {
      this.quads(object.x, object.y, object.w, object.h, (quadrant) => {
        quadrant.add(object);
      });
    } else {
      this.objects.push(object);

      if (this.objects.length > MAX_OBJECTS && this.level < MAX_LEVELS) {
        this.split();

        for (const item of this.objects) {
          this.quads(item.x, item.y, item.w, item.h, (quadrant) => {
            quadrant.add(item);
          });
        }

        this.objects = [];
      }
    }
  }

  get(
    x: number,
    y: number,
    width: number,
    height: number,
    callback: (object: QuadTreeObject) => void,
  ): void {
    for (const object of this.objects) {
      callback(object);
    }

    if (this.quadrants) {
      this.quads(x, y, width, height, (quadrant) => {
        quadrant.get(x, y, width, height, callback);
      });
    }
  }

  clear(): void {
    this.objects = [];
    this.quadrants = null;
  }
}

export { Quadtree };
